import { INSTALL_TARGETS } from '@/lib/product';
import { InstallCommand } from './InstallCommand';

const steps = [
  {
    step: 1,
    title: 'Run one command',
    body: `npx @reflex1abs/cli installs Reflex into ${INSTALL_TARGETS} and can restart your editor.`
  },
  {
    step: 2,
    title: 'Click Enable',
    body: 'When the editor opens, click Enable — or click Reflex in the bottom status bar anytime.'
  },
  {
    step: 3,
    title: 'Keep coding',
    body: 'That’s it. Reflex runs in the background and learns from your workflows locally.'
  }
];

export function Install() {
  return (
    <section
      id="install"
      className="section-padding border-y border-line bg-surface py-20 sm:py-24"
      aria-labelledby="install-heading"
    >
      <div className="section-max">
        <h2 id="install-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Getting started
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          One command. One click. No accounts, no setup files.
        </p>

        <div className="mt-10 rounded-md border border-line bg-card p-5 sm:p-6">
          <InstallCommand />
        </div>

        <ol className="mt-12 card-grid sm:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="p-6">
              <span className="font-mono text-sm text-sage">step {item.step}</span>
              <h3 className="mt-2 text-lg font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
