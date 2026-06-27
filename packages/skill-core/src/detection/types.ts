export interface LoopMatch {
  loopType: 'TYPE_ERROR_LOOP' | 'TEST_FIX_LOOP' | 'API_SCHEMA_LOOP';
  traceIds: string[];
  filesInvolved: string[];
  errorSnippet: string;
  minutesElapsed: number;
}
