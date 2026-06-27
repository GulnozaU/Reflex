import { track } from '@vercel/analytics';

export type TrackEvent =
  | 'install_tab_selected'
  | 'install_command_copied'
  | 'demo_cycle_completed'
  | 'demo_popup_shown'
  | 'demo_pattern_used'
  | 'demo_pattern_dismissed';

export function trackEvent(name: TrackEvent, data?: Record<string, string | number | boolean>) {
  try {
    track(name, data);
  } catch {
    // no-op when analytics unavailable
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[reflex track]', name, data);
  }
}
