export type { TraceRecord, Fingerprint } from './types';
export type { LoopMatch } from './detection/types';
export type { PartialMatch } from './detection/partialMatch';
export type { SavedPattern, PatternOutcomeRecord } from './storage/patternStore';

export { initCaptureStore, closeCaptureStore, getLastTraces } from './capture/db';
export { sanitizeTrace } from './capture/sanitize';
export { recordTrace } from './capture/recordTrace';

export {
  detectTypeErrorLoop,
  detectTestFixLoop,
  detectApiSchemaLoop
} from './detection/detectors';
export {
  detectTypeErrorStart,
  detectTestFixStart,
  detectApiSchemaStart,
  detectPartialMatchStart
} from './detection/partialMatch';
export {
  recordLoopOccurrence,
  getRepeatCount,
  getTotalLoopMinutes,
  fileShapeKey,
  hasRecordedOccurrence
} from './detection/repeatTracker';

export {
  computeApprovalStats,
  occurrenceMatchKey,
  PROMPT_THRESHOLD
} from './detection/approvalStats';
export { buildApprovalMessage, formatMinutes } from './detection/approvalMessage';

export {
  initPatternStore,
  savePattern,
  getPattern,
  listPatterns,
  extractFixSummary,
  patternShapeKey,
  findPatternByShape,
  recordOutcome
} from './storage/patternStore';

export { findRelevantPattern } from './replay/matchPattern';
