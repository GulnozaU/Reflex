import { findPatternByShape, SavedPattern } from '../storage/patternStore';

export function findRelevantPattern(partialMatch: {
  loopType: SavedPattern['loopType'];
  filesInvolved: string[];
}): SavedPattern | null {
  return findPatternByShape(partialMatch.loopType, partialMatch.filesInvolved);
}
