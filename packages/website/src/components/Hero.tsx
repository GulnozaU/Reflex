import { PRODUCT_DEFINITION } from '@/lib/product';
import { PRIMARY_INSTALL_COMMAND } from '@/lib/install';
import { AnimatedBackground } from './AnimatedBackground';
import { CopyButton } from './CopyButton';
import { ProductPreview } from './ProductPreview';

export function Hero() {
  return (
    <section className="relative border-b border-line bg-bg pt-16 pb-16 sm:pt-24 sm:pb-20">
      <AnimatedBackground />
      <div className="section-padding section-max relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <h1 className="font-mono text-sm uppercase tracking-[0.35em] text-foreground sm:text-base">
            Reflex
          </h1>
          <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Capture repeated workflows.
            <br className="hidden sm:block" /> Reuse fixes when they come back.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {PRODUCT_DEFINITION}. Records locally, detects familiar loops, surfaces fix summaries you
            approved before.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-stretch">
            <code
              id="install-command"
              className="panel flex-1 overflow-x-auto px-4 py-3 text-left font-mono text-sm text-foreground"
            >
              {PRIMARY_INSTALL_COMMAND}
            </code>
            <CopyButton text={PRIMARY_INSTALL_COMMAND} label="Copy" />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install"
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
        </div>

        <div id="demo" className="mt-14 animate-fade-up sm:mt-16" style={{ animationDelay: '100ms' }}>
          <ProductPreview variant="hero" />
        </div>
      </div>
    </section>
  );
}
