import * as vscode from 'vscode';

const CONSENT_KEY = 'aiSkill.consentGranted';

export async function ensureConsent(context: vscode.ExtensionContext): Promise<boolean> {
  const granted = context.globalState.get<boolean>(CONSENT_KEY);
  if (granted === true) {
    return true;
  }
  if (granted === false) {
    return false;
  }

  const choice = await vscode.window.showInformationMessage(
    'This extension watches your coding sessions locally to detect repeated workflows. Nothing leaves your machine.',
    { modal: true },
    'Enable',
    'Not now'
  );

  if (choice === 'Enable') {
    await context.globalState.update(CONSENT_KEY, true);
    return true;
  }

  await context.globalState.update(CONSENT_KEY, false);
  return false;
}

export async function resetConsent(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(CONSENT_KEY, undefined);
}

export function isCaptureEnabled(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>(CONSENT_KEY) === true;
}
