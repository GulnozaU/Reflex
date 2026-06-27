import { ProductPreview } from './ProductPreview';

const points = [
  {
    title: 'Local-first',
    body: 'Traces and patterns stay on your machine — SQLite in editor global storage, JSON in your project\'s `.local-patterns/`.'
  },
  {
    title: 'No account required',
    body: 'Install the extension, grant consent once, and start coding. No sign-up, no API keys for Reflex itself.'
  },
  {
    title: 'You control your data',
    body: 'Secrets are redacted before storage. Sensitive paths like `.env` are skipped. You choose when to save a pattern.'
  },
  {
    title: 'No cloud dependency',
    body: 'Reflex does not sync to a server, run embeddings, or phone home. It works offline after install.'
  }
];

export function Privacy() {
  return (
    <section className="section-padding bg-bg py-20 sm:py-24" aria-labelledby="privacy-heading">
      <div className="section-max">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2
              id="privacy-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Your workflow stays yours.
            </h2>
            <p className="mt-4 text-muted">
              Reflex is built for developers who want memory without giving up control. Everything
              described here matches the current implementation.
            </p>
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {points.map((point) => (
                <li key={point.title} className="py-5 transition-colors hover:bg-surface/50">
                  <h3 className="font-medium text-foreground">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ProductPreview variant="section" />
          </div>
        </div>
      </div>
    </section>
  );
}
