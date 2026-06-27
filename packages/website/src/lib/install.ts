/** Public install commands — download URL lives inside @reflex1abs/cli, not on the website. */
import { DOCS_URL, GITHUB_RELEASES, VSIX_FILENAME } from './github';

export const CLI_PACKAGE = '@reflex1abs/cli';

export type InstallEditor = 'cursor' | 'vscode' | 'claude';

export interface InstallOption {
  id: InstallEditor;
  label: string;
  command: string;
  note: string;
}

/** One-liner per tab — no raw VSIX paths in the UI. */
export const INSTALL_OPTIONS: InstallOption[] = [
  {
    id: 'cursor',
    label: 'Cursor',
    command: `npx ${CLI_PACKAGE} install --editor cursor`,
    note: 'Installs Reflex into Cursor. Reload the editor after the command completes.'
  },
  {
    id: 'vscode',
    label: 'VS Code',
    command: `npx ${CLI_PACKAGE} install --editor vscode`,
    note: 'Installs Reflex into VS Code. Requires the code CLI on your PATH.'
  },
  {
    id: 'claude',
    label: 'Claude',
    command: `npx ${CLI_PACKAGE} setup claude`,
    note: 'Installs Reflex into Cursor and prints Claude workflow setup. Reflex runs in the editor alongside Claude — not inside Claude Code CLI.'
  }
];

/** From repo before @reflex1abs/cli is published to npm. */
export const DEV_CLI_COMMANDS: Record<InstallEditor, string> = {
  cursor: 'npm run reflex -- install --editor cursor',
  vscode: 'npm run reflex -- install --editor vscode',
  claude: 'npm run reflex -- setup claude'
};

export const WRONG_CLI_WARNING =
  'Do not use npm install -g reflex-cli — that is an unrelated package. Use npx @reflex1abs/cli instead.';

export function getInstallOption(id: InstallEditor): InstallOption {
  return INSTALL_OPTIONS.find((o) => o.id === id) ?? INSTALL_OPTIONS[0];
}

export { DOCS_URL, GITHUB_RELEASES, VSIX_FILENAME };
