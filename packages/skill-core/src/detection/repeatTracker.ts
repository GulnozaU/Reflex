import { randomUUID } from 'crypto';
import {
  insertLoopOccurrence,
  countLoopOccurrences,
  sumLoopOccurrenceMinutes,
  hasLoopOccurrenceForTraceIds
} from '../capture/db';
import { LoopMatch } from './types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Shape key for repeat counting: sorted unique file extensions. */
export function fileShapeKey(filesInvolved: string[]): string {
  const exts = [
    ...new Set(
      filesInvolved.map((p) => {
        const parts = p.split('.');
        return parts.length > 1 ? parts.pop()!.toLowerCase() : 'none';
      })
    )
  ].sort();
  return exts.join(',');
}

export function recordLoopOccurrence(match: LoopMatch): void {
  insertLoopOccurrence({
    id: randomUUID(),
    loopType: match.loopType,
    filesInvolved: match.filesInvolved,
    fileShape: fileShapeKey(match.filesInvolved),
    errorSnippet: match.errorSnippet,
    minutesElapsed: match.minutesElapsed,
    traceIds: match.traceIds,
    recordedAt: Date.now()
  });
}

export function getRepeatCount(
  loopType: LoopMatch['loopType'],
  filesInvolved: string[]
): number {
  const sinceMs = Date.now() - THIRTY_DAYS_MS;
  return countLoopOccurrences(loopType, fileShapeKey(filesInvolved), sinceMs);
}

export function getTotalLoopMinutes(
  loopType: LoopMatch['loopType'],
  filesInvolved: string[]
): number {
  const sinceMs = Date.now() - THIRTY_DAYS_MS;
  return sumLoopOccurrenceMinutes(loopType, fileShapeKey(filesInvolved), sinceMs);
}

export function hasRecordedOccurrence(match: LoopMatch): boolean {
  return hasLoopOccurrenceForTraceIds(
    match.loopType,
    fileShapeKey(match.filesInvolved),
    match.traceIds
  );
}
