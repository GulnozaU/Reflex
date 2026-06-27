export interface TraceRecord {
  id: string;
  timestamp: number;
  filesChanged: { path: string; ext: string; diffSummary: string }[];
  commandsRun: { cmd: string; exitCode: number }[];
  errorSeen: string[];
  successSignal: boolean;
}

export interface Fingerprint {
  extSequence: string[];
  commandTypes: string[];
  errorCategory: string | null;
}
