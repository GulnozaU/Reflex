import { COMPATIBLE_ASSISTANTS, INSTALL_TARGETS } from '@/lib/product';

const faqs = [
  {
    q: 'What is Reflex?',
    a: 'A local-first workflow memory layer for coding agents and IDEs. It captures file edits and terminal output, detects repeated debugging loops with rule-based matching, and surfaces saved fix summaries. It is not an AI model or code generator.'
  },
  {
    q: 'Where does Reflex install?',
    a: `Into ${INSTALL_TARGETS} — both are VS Code–compatible hosts. One extension adapter, one skill-core data format.`
  },
  {
    q: 'How do Claude Code, Codex, and Cursor Agent fit in?',
    a: `Reflex does not have separate adapters for each assistant. When you use ${COMPATIBLE_ASSISTANTS}, Reflex observes the same file edits and terminal commands through the editor extension.`
  },
  {
    q: 'Where is my data stored?',
    a: 'Session traces in SQLite on your machine (traces.db). Saved patterns in .local-patterns/patterns.json in your project. Core runtime does not upload traces or patterns to a Reflex server.'
  },
  {
    q: 'What loop types does Reflex detect?',
    a: 'Test-fix loops, type-error build loops, and API/schema error loops. Detection runs locally via detectAllLoops() in skill-core — no model calls.'
  },
  {
    q: 'How do I install?',
    a: 'Node.js 18+ and Cursor or VS Code. Run npx @reflex1abs/cli — it detects your editor, installs Reflex, verifies the install, and can restart the editor for you. Click Enable on the one-time consent prompt. No Reflex account or API key.'
  },
  {
    q: 'Is Reflex open source?',
    a: 'MIT licensed. See the GitHub repository for source and issues.'
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
            <div key={item.q} className="py-6">
              <dt className="text-base font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
