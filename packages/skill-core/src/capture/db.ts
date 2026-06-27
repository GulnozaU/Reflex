import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { TraceRecord } from '../types';

let db: SqlJsDatabase | null = null;
let dbPath: string | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS traces (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(timestamp);

  CREATE TABLE IF NOT EXISTS loop_occurrences (
    id TEXT PRIMARY KEY,
    loop_type TEXT NOT NULL,
    files_involved TEXT NOT NULL,
    file_shape TEXT NOT NULL,
    error_snippet TEXT NOT NULL,
    minutes_elapsed REAL NOT NULL,
    trace_ids TEXT NOT NULL,
    recorded_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_loop_occurrences_type_shape ON loop_occurrences(loop_type, file_shape, recorded_at);
`;

function resolveSqlJsDir(): string {
  try {
    return path.join(path.dirname(require.resolve('sql.js')), '..', 'dist');
  } catch {
    return path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist');
  }
}

function persist(): void {
  if (!db || !dbPath) {
    return;
  }
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

export async function initCaptureStore(options: { dbPath: string }): Promise<void> {
  if (db) {
    closeCaptureStore();
  }
  dbPath = options.dbPath;
  const dir = path.dirname(options.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(resolveSqlJsDir(), file)
  });

  if (fs.existsSync(options.dbPath)) {
    db = new SQL.Database(fs.readFileSync(options.dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  persist();
}

export function closeCaptureStore(): void {
  if (db) {
    persist();
    db.close();
    db = null;
  }
  dbPath = null;
}

export function insertTrace(trace: TraceRecord): void {
  if (!db) {
    throw new Error('Capture store not initialized. Call initCaptureStore first.');
  }
  db.run('INSERT OR REPLACE INTO traces (id, timestamp, data) VALUES (?, ?, ?)', [
    trace.id,
    trace.timestamp,
    JSON.stringify(trace)
  ]);
  persist();
}

export function getTraceCount(): number {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const result = db.exec('SELECT COUNT(*) as count FROM traces');
  if (!result.length || !result[0].values.length) {
    return 0;
  }
  return result[0].values[0][0] as number;
}

/** For tests only */
export function getLastTraces(limit: number): TraceRecord[] {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const stmt = db.prepare(
    'SELECT data FROM traces ORDER BY timestamp DESC LIMIT ?'
  );
  stmt.bind([limit]);
  const rows: TraceRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as { data: string };
    rows.push(JSON.parse(row.data) as TraceRecord);
  }
  stmt.free();
  return rows.reverse();
}

export function insertLoopOccurrence(row: {
  id: string;
  loopType: string;
  filesInvolved: string[];
  fileShape: string;
  errorSnippet: string;
  minutesElapsed: number;
  traceIds: string[];
  recordedAt: number;
}): void {
  if (!db) {
    throw new Error('Capture store not initialized. Call initCaptureStore first.');
  }
  db.run(
    `INSERT INTO loop_occurrences
      (id, loop_type, files_involved, file_shape, error_snippet, minutes_elapsed, trace_ids, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.loopType,
      JSON.stringify(row.filesInvolved),
      row.fileShape,
      row.errorSnippet,
      row.minutesElapsed,
      JSON.stringify(row.traceIds),
      row.recordedAt
    ]
  );
  persist();
}

export function countLoopOccurrences(
  loopType: string,
  fileShape: string,
  sinceMs: number
): number {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM loop_occurrences WHERE loop_type = ? AND file_shape = ? AND recorded_at >= ?'
  );
  stmt.bind([loopType, fileShape, sinceMs]);
  stmt.step();
  const row = stmt.getAsObject() as { count: number };
  stmt.free();
  return row.count;
}

export function sumLoopOccurrenceMinutes(
  loopType: string,
  fileShape: string,
  sinceMs: number
): number {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const stmt = db.prepare(
    'SELECT COALESCE(SUM(minutes_elapsed), 0) as total FROM loop_occurrences WHERE loop_type = ? AND file_shape = ? AND recorded_at >= ?'
  );
  stmt.bind([loopType, fileShape, sinceMs]);
  stmt.step();
  const row = stmt.getAsObject() as { total: number };
  stmt.free();
  return row.total;
}

export function hasLoopOccurrenceForTraceIds(
  loopType: string,
  fileShape: string,
  traceIds: string[]
): boolean {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const traceIdsJson = JSON.stringify(traceIds);
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM loop_occurrences WHERE loop_type = ? AND file_shape = ? AND trace_ids = ?'
  );
  stmt.bind([loopType, fileShape, traceIdsJson]);
  stmt.step();
  const row = stmt.getAsObject() as { count: number };
  stmt.free();
  return row.count > 0;
}

export function getTrace(id: string): TraceRecord | null {
  if (!db) {
    throw new Error('Capture store not initialized.');
  }
  const stmt = db.prepare('SELECT data FROM traces WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as { data: string };
  stmt.free();
  return JSON.parse(row.data) as TraceRecord;
}
