import { TraceRecord } from '../types';
import { sanitizeTrace } from './sanitize';
import { insertTrace } from './db';

export function recordTrace(trace: TraceRecord): void {
  const safe = sanitizeTrace(trace);
  insertTrace(safe);
}
