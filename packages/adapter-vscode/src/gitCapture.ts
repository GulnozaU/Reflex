import { execSync } from 'child_process';

const TEST_PATH_RE = /test|spec/i;

/** Uncommitted src files (not tests) from git — fallback when agent writes without VS Code events. */
export function getModifiedProductionFiles(workspaceRoot: string): string[] {
  try {
    const out = execSync('git diff HEAD --name-only', {
      cwd: workspaceRoot,
      encoding: 'utf8',
      timeout: 5000
    });
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (path) =>
          path.length > 0 &&
          path.startsWith('src/') &&
          !TEST_PATH_RE.test(path) &&
          !path.includes('node_modules')
      );
  } catch {
    return [];
  }
}

export function isTestCommand(cmd: string): boolean {
  return /\b(test|jest|vitest|pytest)\b/i.test(cmd);
}
