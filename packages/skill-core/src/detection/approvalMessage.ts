import { LoopMatch } from './types';

const LOOP_DESCRIPTIONS: Record<LoopMatch['loopType'], string> = {
  TYPE_ERROR_LOOP: 'type error fix loop',
  TEST_FIX_LOOP: 'test fix loop',
  API_SCHEMA_LOOP: 'API schema fix loop'
};

export function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function buildApprovalMessage(
  match: LoopMatch,
  occurrenceCount: number,
  totalMinutesSpent: number
): string {
  const article = match.loopType === 'API_SCHEMA_LOOP' ? 'an' : 'a';
  return (
    `You just spent ~${formatMinutes(match.minutesElapsed)} min on ${article} ` +
    `${LOOP_DESCRIPTIONS[match.loopType]} you've hit ${occurrenceCount} times. ` +
    `Total so far: ${formatMinutes(totalMinutesSpent)} min. Save this fix?`
  );
}
