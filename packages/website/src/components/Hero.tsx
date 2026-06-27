import { AnimatedBackground } from './AnimatedBackground';
import { InstallCommand } from './InstallCommand';
import { ProductPreview } from './ProductPreview';

export function Hero() {
  return (
    <section className="relative border-b border-line bg-bg pt-14 pb-16 sm:pt-20 sm:pb-20">
      <AnimatedBackground />
      <div className="section-padding section-max relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">reflex</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Your AI coding agent learns what works.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Reflex captures successful workflows, fixes, and repeated patterns from real coding
            sessions — then reuses them when similar situations appear.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install-command"
              className="inline-flex items-center justify-center rounded-md bg-bronze px-5 py-2.5 text-sm font-medium text-bg transition hover:brightness-110"
            >
              Install Reflex
            </a>
            <a
              href="#demo"
              className="panel-interactive inline-flex items-center justify-center rounded-md border border-line bg-card px-5 py-2.5 text-sm font-medium text-foreground"
            >
              See demo
            </a>
          </div>

          <div id="install-command" className="mt-8 text-left">
            <InstallCommand compact />
          </div>
        </div>

        <div id="demo" className="mt-14 animate-fade-up sm:mt-16" style={{ animationDelay: '100ms' }}>
          <ProductPreview variant="hero" />
        </div>
      </div>
    </section>
  );
}
