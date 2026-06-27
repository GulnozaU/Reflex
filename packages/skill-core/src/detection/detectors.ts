import { TraceRecord } from '../types';
import { LoopMatch } from './types';

type TimelineEvent =
  | { kind: 'command'; traceId: string; timestamp: number; cmd: string; exitCode: number }
  | { kind: 'file'; traceId: string; timestamp: number; path: string; ext: string }
  | { kind: 'errors'; traceId: string; timestamp: number; messages: string[] };

function sortedTraces(traces: TraceRecord[]): TraceRecord[] {
  return [...traces].sort((a, b) => a.timestamp - b.timestamp);
}

/** Expand cumulative trace snapshots into ordered timeline events. */
export function tracesToTimeline(traces: TraceRecord[]): TimelineEvent[] {
  const ordered = sortedTraces(traces);
  const events: TimelineEvent[] = [];
  let prevCmd = 0;
  let prevFile = 0;
  let prevErr = 0;

  for (const trace of ordered) {
    for (let i = prevCmd; i < trace.commandsRun.length; i++) {
      const c = trace.commandsRun[i];
      events.push({
        kind: 'command',
        traceId: trace.id,
        timestamp: trace.timestamp,
        cmd: c.cmd,
        exitCode: c.exitCode
      });
    }
    for (let i = prevFile; i < trace.filesChanged.length; i++) {
      const f = trace.filesChanged[i];
      events.push({
        kind: 'file',
        traceId: trace.id,
        timestamp: trace.timestamp,
        path: f.path,
        ext: f.ext
      });
    }
    if (trace.errorSeen.length > prevErr) {
      events.push({
        kind: 'errors',
        traceId: trace.id,
        timestamp: trace.timestamp,
        messages: trace.errorSeen.slice(prevErr)
      });
    }
    prevCmd = trace.commandsRun.length;
    prevFile = trace.filesChanged.length;
    prevErr = trace.errorSeen.length;
  }

  return events;
}

function isBuildCommand(cmd: string): boolean {
  return /\b(tsc|build)\b/i.test(cmd);
}

function isTestCommand(cmd: string): boolean {
  return /\b(test|jest|vitest|pytest)\b/i.test(cmd);
}

function commandsSimilar(a: string, b: string): boolean {
  return a.trim() === b.trim() || /\b(test|jest|vitest|pytest)\b/i.test(a) && /\b(test|jest|vitest|pytest)\b/i.test(b);
}

function hasTsError(messages: string[]): boolean {
  return messages.some((m) => /\bTS\d+\b/i.test(m) || /\bTS\b/.test(m));
}

const API_ERROR_RE = /ECONNREFUSED|404|schema|validation error|missing field/i;

function isApiError(message: string): boolean {
  return API_ERROR_RE.test(message);
}

function isApiFixPath(path: string): boolean {
  return /\.json$/i.test(path) || /\/api\//i.test(path) || /\/routes\//i.test(path) || /schema/i.test(path);
}

function isTestPath(path: string): boolean {
  return /test|spec/i.test(path);
}

function minutesBetween(start: number, end: number): number {
  return Math.max(0, (end - start) / 60_000);
}

function collectTraceIds(...ids: (string | undefined)[]): string[] {
  return [...new Set(ids.filter(Boolean) as string[])];
}

export function detectTypeErrorLoop(traces: TraceRecord[]): LoopMatch | null {
  const ordered = sortedTraces(traces);
  const events = tracesToTimeline(traces);
  const traceById = new Map(ordered.map((t) => [t.id, t]));
  const traceIndex = new Map(ordered.map((t, idx) => [t.id, idx]));
  let latest: LoopMatch | null = null;

  for (let i = 0; i < events.length; i++) {
    const start = events[i];
    if (start.kind !== 'command' || !isBuildCommand(start.cmd) || start.exitCode === 0) {
      continue;
    }

    const traceAtFail = traceById.get(start.traceId);
    if (!traceAtFail) {
      continue;
    }
    const idx = traceIndex.get(start.traceId) ?? 0;
    const prevErrCount = idx > 0 ? ordered[idx - 1].errorSeen.length : 0;
    const newErrors = traceAtFail.errorSeen.slice(prevErrCount);
    const tsErrors = newErrors.filter((m) => /\bTS/i.test(m));
    if (tsErrors.length === 0 && !hasTsError(newErrors.length ? newErrors : traceAtFail.errorSeen)) {
      continue;
    }

    let savedPath: string | undefined;
    let fixTimestamp = start.timestamp;
    let fixTraceId = start.traceId;

    for (let j = i + 1; j < events.length; j++) {
      const ev = events[j];
      if (ev.kind === 'file' && !savedPath) {
        savedPath = ev.path;
        fixTimestamp = ev.timestamp;
        fixTraceId = ev.traceId;
        continue;
      }
      if (ev.kind === 'command' && savedPath && isBuildCommand(ev.cmd) && ev.exitCode === 0) {
        latest = {
          loopType: 'TYPE_ERROR_LOOP',
          traceIds: collectTraceIds(start.traceId, fixTraceId, ev.traceId),
          filesInvolved: [savedPath],
          errorSnippet: tsErrors[0] ?? traceAtFail.errorSeen.find((m) => /\bTS/i.test(m)) ?? '',
          minutesElapsed: minutesBetween(start.timestamp, fixTimestamp)
        };
      }
    }
  }

  return latest;
}

export function detectTestFixLoop(traces: TraceRecord[]): LoopMatch | null {
  const events = tracesToTimeline(traces);
  let latest: LoopMatch | null = null;

  for (let i = 0; i < events.length; i++) {
    const start = events[i];
    if (start.kind !== 'command' || !isTestCommand(start.cmd) || start.exitCode === 0) {
      continue;
    }

    let savedPath: string | undefined;
    let fixTimestamp = start.timestamp;
    let fixTraceId = start.traceId;
    const failCmd = start.cmd;

    for (let j = i + 1; j < events.length; j++) {
      const ev = events[j];
      if (ev.kind === 'file' && !savedPath && !isTestPath(ev.path)) {
        savedPath = ev.path;
        fixTimestamp = ev.timestamp;
        fixTraceId = ev.traceId;
        continue;
      }
      if (ev.kind === 'command' && savedPath && commandsSimilar(failCmd, ev.cmd) && ev.exitCode === 0) {
        latest = {
          loopType: 'TEST_FIX_LOOP',
          traceIds: collectTraceIds(start.traceId, fixTraceId, ev.traceId),
          filesInvolved: [savedPath],
          errorSnippet: `test failed: ${failCmd}`,
          minutesElapsed: minutesBetween(start.timestamp, fixTimestamp)
        };
      }
    }
  }

  return latest;
}

export function detectApiSchemaLoop(traces: TraceRecord[]): LoopMatch | null {
  const ordered = sortedTraces(traces);
  if (ordered.length === 0) {
    return null;
  }

  let latest: LoopMatch | null = null;
  let prevErrorCount = 0;

  for (let i = 0; i < ordered.length; i++) {
    const trace = ordered[i];
    const newApiErrors = trace.errorSeen.slice(prevErrorCount).filter(isApiError);
    prevErrorCount = trace.errorSeen.length;
    if (newApiErrors.length === 0) {
      continue;
    }

    const errorSnippet = newApiErrors[0];
    const startTime = trace.timestamp;
    let fixPath: string | undefined;
    let fixTime = startTime;
    let fixTraceId = trace.id;
    let fixTraceIndex = i;

    for (let j = i; j < ordered.length; j++) {
      const t = ordered[j];
      if (!fixPath) {
        const fixFile = t.filesChanged.find((f) => isApiFixPath(f.path));
        if (fixFile) {
          fixPath = fixFile.path;
          fixTime = t.timestamp;
          fixTraceId = t.id;
          fixTraceIndex = j;
        }
      }
    }

    if (!fixPath) {
      continue;
    }

    const fixTrace = ordered[fixTraceIndex];
    const errorsAfterFix = fixTrace.errorSeen.length;

    for (let k = fixTraceIndex + 1; k < ordered.length; k++) {
      const later = ordered[k];
      const newErrors = later.errorSeen.slice(errorsAfterFix);
      const newCommands = later.commandsRun.slice(fixTrace.commandsRun.length);
      const hasRerun = newCommands.length > 0;
      const apiErrorGone = !newErrors.some(isApiError);

      if (hasRerun && apiErrorGone) {
        latest = {
          loopType: 'API_SCHEMA_LOOP',
          traceIds: collectTraceIds(trace.id, fixTraceId, later.id),
          filesInvolved: [fixPath],
          errorSnippet,
          minutesElapsed: minutesBetween(startTime, fixTime)
        };
      }
    }
  }

  return latest;
}
