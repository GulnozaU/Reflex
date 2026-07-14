import { LOCAL_FIRST_POINTS, PRODUCT_DEFINITION } from '@/lib/product';

const points = [
  {
    title: 'Local-first runtime',
    body: LOCAL_FIRST_POINTS[0] + ' Traces and patterns stay on your machine.'
  },
  {
    title: 'No account required',
    body: 'Install the extension, grant consent once, and start coding. Core functionality does not require sign-up or Reflex API keys.'
  },
  {
    title: 'You control your data',
    body: 'Secrets are redacted before storage. Sensitive paths like `.env` are skipped. You choose when to save a pattern.'
  },
  {
    title: 'Distribution',
    body: 'The install CLI downloads the extension from static hosting. After install, capture and replay work offline.'
  }
];

export function Privacy() {
  return (
    <section className="section-padding bg-bg py-20 sm:py-24" aria-labelledby="privacy-heading">
      <div className="section-max max-w-3xl">
        <h2
          id="privacy-heading"
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {PRODUCT_DEFINITION}
        </h2>
        <p className="mt-4 text-muted">
          Reflex is not an AI model, cloud service, code generator, or agent framework. It captures
          events, detects patterns, and stores workflow memory locally.
        </p>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {points.map((point) => (
            <li key={point.title} className="py-5">
              <h3 className="font-medium text-foreground">{point.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
