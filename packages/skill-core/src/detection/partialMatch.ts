import { TraceRecord } from '../types';

export interface PartialMatch {
  loopType: 'TYPE_ERROR_LOOP' | 'TEST_FIX_LOOP' | 'API_SCHEMA_LOOP';
  errorSnippet: string;
  filesInvolved: string[];
}

const API_ERROR_RE = /ECONNREFUSED|404|schema|validation error|missing field/i;

function lastCommand(trace: TraceRecord): { cmd: string; exitCode: number } | undefined {
  return trace.commandsRun.at(-1);
}

function filesFromTrace(trace: TraceRecord): string[] {
  return trace.filesChanged.map((f) => f.path);
}

/** Single-trace, first-half only: build/tsc failed with a TS error. */
export function detectTypeErrorStart(latestTrace: TraceRecord): PartialMatch | null {
  const cmd = lastCommand(latestTrace);
  if (!cmd || cmd.exitCode === 0) {
    return null;
  }
  if (!/\b(tsc|build)\b/i.test(cmd.cmd)) {
    return null;
  }

  const tsError = latestTrace.errorSeen.find((m) => /\bTS/i.test(m));
  if (!tsError) {
    return null;
  }

  return {
    loopType: 'TYPE_ERROR_LOOP',
    errorSnippet: tsError,
    filesInvolved: filesFromTrace(latestTrace)
  };
}

/** Single-trace, first-half only: test runner failed. */
export function detectTestFixStart(latestTrace: TraceRecord): PartialMatch | null {
  const cmd = lastCommand(latestTrace);
  if (!cmd || cmd.exitCode === 0) {
    return null;
  }
  if (!/\b(test|jest|vitest|pytest)\b/i.test(cmd.cmd)) {
    return null;
  }

  return {
    loopType: 'TEST_FIX_LOOP',
    errorSnippet: latestTrace.errorSeen[0] ?? `test failed: ${cmd.cmd}`,
    filesInvolved: filesFromTrace(latestTrace)
  };
}

/** Single-trace, first-half only: API/schema error appeared. */
export function detectApiSchemaStart(latestTrace: TraceRecord): PartialMatch | null {
  const apiError = latestTrace.errorSeen.find((m) => API_ERROR_RE.test(m));
  if (!apiError) {
    return null;
  }

  return {
    loopType: 'API_SCHEMA_LOOP',
    errorSnippet: apiError,
    filesInvolved: filesFromTrace(latestTrace)
  };
}

/** Run all partial-start detectors on one trace; returns first match in priority order. */
export function detectPartialMatchStart(latestTrace: TraceRecord): PartialMatch | null {
  return (
    detectTypeErrorStart(latestTrace) ??
    detectTestFixStart(latestTrace) ??
    detectApiSchemaStart(latestTrace)
  );
}
