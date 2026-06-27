import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { LoopMatch } from '../detection/types';
import { fileShapeKey } from '../detection/repeatTracker';
import { TraceRecord } from '../types';

export interface SavedPattern {
  id: string;
  loopType: 'TYPE_ERROR_LOOP' | 'TEST_FIX_LOOP' | 'API_SCHEMA_LOOP';
  filesInvolved: string[];
  fixSummary: string;
  occurrenceCount: number;
  totalMinutesSpent: number;
  thumbsUp: number | null;
  createdAt: number;
}

let workspaceRoot: string | null = null;

export function initPatternStore(options: { workspaceRoot: string }): void {
  workspaceRoot = options.workspaceRoot;
}

function patternsFilePath(): string {
  if (!workspaceRoot) {
    throw new Error('Pattern store not initialized. Call initPatternStore first.');
  }
  return path.join(workspaceRoot, '.local-patterns', 'patterns.json');
}

function ensurePatternsDir(): void {
  const dir = path.dirname(patternsFilePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readPatterns(): SavedPattern[] {
  ensurePatternsDir();
  const filePath = patternsFilePath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) {
    return [];
  }
  return JSON.parse(raw) as SavedPattern[];
}

function writePatterns(patterns: SavedPattern[]): void {
  ensurePatternsDir();
  fs.writeFileSync(patternsFilePath(), JSON.stringify(patterns, null, 2));
}

/** Same key used for save dedup — loopType + sorted file extensions via fileShapeKey. */
// MVP limitation: extension-only shape (e.g. any .ts file matches any .ts pattern).
// Tighten later with path-prefix/directory if cross-file suggestions feel irrelevant.
export function patternShapeKey(
  loopType: SavedPattern['loopType'],
  filesInvolved: string[]
): string {
  return `${loopType}:${fileShapeKey(filesInvolved)}`;
}

function patternShapeKeyFromSaved(pattern: Pick<SavedPattern, 'loopType' | 'filesInvolved'>): string {
  return patternShapeKey(pattern.loopType, pattern.filesInvolved);
}

export function findPatternByShape(
  loopType: SavedPattern['loopType'],
  filesInvolved: string[]
): SavedPattern | null {
  const shape = patternShapeKey(loopType, filesInvolved);
  return readPatterns().find((p) => patternShapeKeyFromSaved(p) === shape) ?? null;
}

export function extractFixSummary(traces: TraceRecord[], match: LoopMatch): string {
  const traceById = new Map(traces.map((t) => [t.id, t]));
  const summaries: string[] = [];

  for (const traceId of match.traceIds) {
    const trace = traceById.get(traceId);
    if (!trace) {
      continue;
    }
    for (const file of trace.filesChanged) {
      if (match.filesInvolved.includes(file.path) && file.diffSummary.trim()) {
        summaries.push(file.diffSummary.trim());
      }
    }
  }

  return summaries.join('; ') || match.errorSnippet;
}

export function savePattern(match: LoopMatch, fixSummary: string): void {
  const patterns = readPatterns();
  const shape = patternShapeKey(match.loopType, match.filesInvolved);
  const existing = patterns.find((p) => patternShapeKeyFromSaved(p) === shape);

  if (existing) {
    existing.occurrenceCount += 1;
    existing.totalMinutesSpent += match.minutesElapsed;
    existing.fixSummary = fixSummary;
  } else {
    patterns.push({
      id: randomUUID(),
      loopType: match.loopType,
      filesInvolved: match.filesInvolved,
      fixSummary,
      occurrenceCount: 1,
      totalMinutesSpent: match.minutesElapsed,
      thumbsUp: null,
      createdAt: Date.now()
    });
  }

  writePatterns(patterns);
}

export function getPattern(id: string): SavedPattern | null {
  return readPatterns().find((p) => p.id === id) ?? null;
}

export function listPatterns(): SavedPattern[] {
  return readPatterns();
}

export interface PatternOutcomeRecord {
  patternId: string;
  wasShown: boolean;
  userClickedView: boolean;
  thumbsUp: boolean | null;
  recordedAt: number;
}

function outcomesFilePath(): string {
  if (!workspaceRoot) {
    throw new Error('Pattern store not initialized. Call initPatternStore first.');
  }
  return path.join(workspaceRoot, '.local-patterns', 'outcomes.jsonl');
}

export function recordOutcome(
  patternId: string,
  outcome: { wasShown: boolean; userClickedView: boolean; thumbsUp: boolean | null }
): void {
  ensurePatternsDir();
  const row: PatternOutcomeRecord = {
    patternId,
    wasShown: outcome.wasShown,
    userClickedView: outcome.userClickedView,
    thumbsUp: outcome.thumbsUp,
    recordedAt: Date.now()
  };
  fs.appendFileSync(outcomesFilePath(), `${JSON.stringify(row)}\n`);
}
