const steps = [
  {
    num: '01',
    title: 'Capture',
    body: 'File edits and terminal commands are recorded locally after you opt in. Traces go to SQLite in editor global storage.'
  },
  {
    num: '02',
    title: 'Detect',
    body: 'Rule-based matching via detectAllLoops() in skill-core: test-fix cycles, type-error cycles, and API/schema failures.'
  },
  {
    num: '03',
    title: 'Save',
    body: 'When you approve, Reflex writes reusable fixes to `.local-patterns/patterns.json` in your project.'
  },
  {
    num: '04',
    title: 'Replay',
    body: 'When a similar failure starts again, Reflex shows a status bar hint and prompt with the saved fix summary.'
  }
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-padding border-y border-line bg-surface py-20 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="section-max">
        <h2 id="how-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Four steps from observation to replay. Core runtime is local-first — no account required.
        </p>

        <ol className="mt-10 card-grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.num} className="p-6">
              <span className="font-mono text-xs text-muted">{step.num}</span>
              <h3 className="mt-2 text-lg font-medium text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
