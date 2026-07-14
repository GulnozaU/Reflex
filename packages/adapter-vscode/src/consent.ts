import * as vscode from 'vscode';

const CONSENT_KEY = 'aiSkill.consentGranted';

export type ConsentState = 'unknown' | 'granted' | 'declined';

export function getConsentState(context: vscode.ExtensionContext): ConsentState {
  const granted = context.globalState.get<boolean>(CONSENT_KEY);
  if (granted === true) return 'granted';
  if (granted === false) return 'declined';
  return 'unknown';
}

export function isCaptureEnabled(context: vscode.ExtensionContext): boolean {
  return getConsentState(context) === 'granted';
}

/** First-run modal. Returns true if user enables Reflex. */
export async function promptConsentModal(): Promise<boolean> {
  const choice = await vscode.window.showInformationMessage(
    'Reflex captures your coding workflows locally so repeated fixes can be reused. Nothing is sent to a Reflex server.',
    { modal: true },
    'Enable',
    'Not now'
  );
  return choice === 'Enable';
}

/** Soft prompt (toast) for when status bar is clicked or first install was skipped. */
export async function promptConsentToast(): Promise<boolean> {
  const choice = await vscode.window.showInformationMessage(
    'Enable Reflex? It records file edits and terminal commands locally to detect repeated workflows.',
    'Enable',
    'Not now'
  );
  return choice === 'Enable';
}

export async function setConsent(
  context: vscode.ExtensionContext,
  enabled: boolean
): Promise<void> {
  await context.globalState.update(CONSENT_KEY, enabled);
}

export async function resetConsent(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(CONSENT_KEY, undefined);
}

/**
 * Resolve consent for activation.
 * - granted → true
 * - unknown → show modal once
 * - declined → false (status bar offers one-click enable — no Command Palette needed)
 */
export async function ensureConsent(context: vscode.ExtensionContext): Promise<boolean> {
  const state = getConsentState(context);
  if (state === 'granted') {
    return true;
  }
  if (state === 'declined') {
    return false;
  }

  const enabled = await promptConsentModal();
  await setConsent(context, enabled);
  return enabled;
}
