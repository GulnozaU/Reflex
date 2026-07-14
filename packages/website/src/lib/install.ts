/** Public install — download URL lives inside @reflex1abs/cli, not on the website. */
import { DOCS_URL, GITHUB_RELEASES, VSIX_FILENAME } from './github';
import {
  CLI_INSTALL_COMMAND,
  CLI_PACKAGE,
  COMPATIBLE_ASSISTANTS,
  INSTALL_TARGETS
} from './product';

export { CLI_INSTALL_COMMAND as PRIMARY_INSTALL_COMMAND, CLI_PACKAGE, INSTALL_TARGETS, COMPATIBLE_ASSISTANTS };

export const INSTALL_NOTE = `Installs into ${INSTALL_TARGETS}. Captures workflow from ${COMPATIBLE_ASSISTANTS}. The CLI detects your editor, installs Reflex, and can restart it for you.`;

/** From repo before/alongside npm publish. */
export const DEV_CLI_COMMAND = 'npm run reflex';

export const WRONG_CLI_WARNING =
  'Do not use npm install -g reflex-cli — that is an unrelated package. Use npx @reflex1abs/cli instead.';

export { DOCS_URL, GITHUB_RELEASES, VSIX_FILENAME };
