import { TraceRecord } from '../types';
import { LoopMatch } from './types';
import { detectApiSchemaLoop, detectTestFixLoop, detectTypeErrorLoop } from './detectors';

const DETECTORS = [detectTypeErrorLoop, detectTestFixLoop, detectApiSchemaLoop] as const;

/** Run all loop detectors against a trace window. Single detection entry point for adapters. */
export function detectAllLoops(traces: TraceRecord[]): LoopMatch[] {
  const matches: LoopMatch[] = [];
  for (const detect of DETECTORS) {
    const match = detect(traces);
    if (match) {
      matches.push(match);
    }
  }
  return matches;
}
