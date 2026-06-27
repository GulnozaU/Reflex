const faqs = [
  {
    q: 'Does Reflex replace my AI coding agent?',
    a: 'No. Reflex improves the workflow around agents — it captures what you do locally, detects repeated debugging loops, and surfaces saved fixes when similar failures start again. Your agent still writes code; Reflex adds memory.'
  },
  {
    q: 'Does my code leave my machine?',
    a: 'Reflex is local-first. Session traces are stored in SQLite on your machine (editor global storage). Saved patterns live in `.local-patterns/patterns.json` inside your project. Reflex does not upload your code or traces to a cloud service.'
  },
  {
    q: 'Who is it for?',
    a: 'Developers who use AI coding tools daily — Cursor, VS Code with Copilot or similar — and hit the same debugging patterns repeatedly. If you have never re-fixed the same class of test failure twice, you may not need Reflex yet.'
  },
  {
    q: 'What loop types does Reflex detect today?',
    a: 'Test-fix loops (fail → fix in src → pass), type-error build loops, and API/schema error loops. Detection runs locally against your recent session traces — no LLM calls for pattern matching.'
  },
  {
    q: 'Is Reflex open source?',
    a: 'The project is MIT licensed. See the GitHub repository for source, issues, and contribution guidelines.'
  }
];

export function FAQ() {
  return (
    <section className="section-padding bg-bg py-20 sm:py-24" aria-labelledby="faq-heading">
      <div className="section-max max-w-3xl">
        <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          FAQ
        </h2>
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {faqs.map((item) => (
            <div key={item.q} className="py-6 transition-colors hover:bg-surface/40">
              <dt className="text-base font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
