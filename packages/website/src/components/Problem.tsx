const cards = [
  {
    title: 'Repeated debugging',
    body: 'You fix the same class of bug — test failures, type errors, schema mismatches — across multiple sessions.'
  },
  {
    title: 'Context does not carry over',
    body: 'Each new chat or session starts from scratch. You re-describe the failure, the file, and what worked last time.'
  },
  {
    title: 'Fixes are not reused',
    body: 'Without a record of what worked, the same loop can play out again even when the solution is already known.'
  }
];

export function Problem() {
  return (
    <section className="section-padding bg-bg py-20 sm:py-24" aria-labelledby="problem-heading">
      <div className="section-max">
        <h2
          id="problem-heading"
          className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Repeated fixes do not stick between sessions.
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Reflex watches file edits and terminal output locally, then surfaces saved fixes when a
          familiar loop starts again.
        </p>
        <div className="mt-12 card-grid sm:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="panel-interactive p-6">
              <h3 className="text-base font-medium text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
