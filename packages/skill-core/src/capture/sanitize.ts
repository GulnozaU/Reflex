import { TraceRecord } from '../types';
import { redactString, shouldSkipFile } from './constants';

/**
 * Returns a safe copy of trace before persistence.
 * - Drops sensitive files entirely (no diff recorded)
 * - Redacts secrets in remaining diffSummary, cmd, and error strings
 */
export function sanitizeTrace(trace: TraceRecord): TraceRecord {
  const filesChanged = trace.filesChanged
    .filter((f) => !shouldSkipFile(f.path))
    .map((f) => ({
      path: f.path,
      ext: f.ext,
      diffSummary: redactString(f.diffSummary)
    }));

  const commandsRun = trace.commandsRun.map((c) => ({
    cmd: redactString(c.cmd),
    exitCode: c.exitCode
  }));

  const errorSeen = trace.errorSeen.map((e) => redactString(e));

  return {
    id: trace.id,
    timestamp: trace.timestamp,
    filesChanged,
    commandsRun,
    errorSeen,
    successSignal: trace.successSignal
  };
}
