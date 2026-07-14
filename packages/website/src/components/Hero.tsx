import {
  COMPATIBLE_ASSISTANTS,
  INSTALL_TARGETS,
  PRODUCT_DEFINITION
} from '@/lib/product';
import { AnimatedBackground } from './AnimatedBackground';
import { InstallCommand } from './InstallCommand';
import { ProductPreview } from './ProductPreview';
import { TypingText } from './TypingText';

export function Hero() {
  return (
    <section className="relative border-b border-line bg-bg pt-14 pb-16 sm:pt-20 sm:pb-20">
      <AnimatedBackground />
      <div className="section-padding section-max relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">reflex</p>
          <p className="mb-2 font-mono text-xs text-muted">{PRODUCT_DEFINITION}</p>
          <p className="mb-6 font-mono text-[11px] leading-relaxed text-muted">
            Install: {INSTALL_TARGETS} · Works with {COMPATIBLE_ASSISTANTS}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Capture repeated workflows. Reuse fixes when they come back.
          </h1>
          <p className="mx-auto mt-5 min-h-[3.5rem] max-w-2xl text-lg leading-relaxed text-muted">
            <TypingText text="Reflex records file edits and terminal output locally, detects familiar debugging loops, and surfaces saved fix summaries you approved before." />
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install-command"
              className="inline-flex items-center justify-center rounded-md bg-sage px-5 py-2.5 text-sm font-medium text-bg transition hover:bg-sage/90"
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
