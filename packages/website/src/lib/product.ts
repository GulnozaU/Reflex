/**
 * Canonical product definitions for the marketing site.
 * Keep in sync with packages/skill-core/src/product.ts and ARCHITECTURE.md.
 */

export const PRODUCT_DEFINITION =
  'Local-first workflow memory layer for coding agents and IDEs';

export const INSTALL_TARGETS = 'Cursor and VS Code';

export const COMPATIBLE_ASSISTANTS =
  'Claude Code, Codex, Cursor Agent, Copilot, and other assistants used inside those editors';

export const LOCAL_FIRST_POINTS = [
  'All session data is stored on-device only',
  'No code, terminal output, or file contents are sent to a Reflex server',
  'No user accounts are required for core functionality',
  'Pattern detection runs locally in skill-core — no model calls',
  'All capture paths write to the same local data format (traces.db + .local-patterns/)'
] as const;

export const CLARITY = {
  whatReflexStores:
    'Sanitized file-edit metadata, terminal commands, exit codes, and error snippets from your session',
  whereDataLives:
    'traces.db in editor global storage; patterns in .local-patterns/patterns.json in your project',
  whatRunsLocally:
    'Capture, sanitization, loop detection, pattern storage, and replay matching (skill-core)',
  whatIsSharedAcrossEditors:
    'One VS Code–compatible extension adapter and one skill-core data format — no per-assistant backends'
} as const;

export const CLI_PACKAGE = '@reflex1abs/cli';
export const CLI_INSTALL_COMMAND = `npx ${CLI_PACKAGE}`;
