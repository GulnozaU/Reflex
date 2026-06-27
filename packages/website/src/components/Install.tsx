import { InstallCommand } from './InstallCommand';

const steps = [
  {
    step: 1,
    title: 'Install the extension',
    body: 'Run the install command from the hero, or download the .vsix from GitHub Releases.'
  },
  {
    step: 2,
    title: 'Enable local memory',
    body: 'Accept the consent prompt on first launch. Reflex only captures after you opt in.'
  },
  {
    step: 3,
    title: 'Start coding',
    body: 'Work normally. Reflex observes sessions, detects repeated loops, and offers to save patterns you approve.'
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
          Three steps after install. No account, no cloud configuration.
        </p>

        <div className="mt-10 rounded-md border border-line bg-card p-5 sm:p-6">
          <InstallCommand />
        </div>

        <ol className="mt-12 card-grid sm:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="p-6">
              <span className="font-mono text-sm text-bronze">step {item.step}</span>
              <h3 className="mt-2 text-lg font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
