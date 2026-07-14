import { PRODUCT_DEFINITION } from '@/lib/product';
import { GITHUB_URL } from '@/lib/github';

export function Footer() {
  return (
    <footer className="section-padding border-t border-line bg-surface py-12">
      <div className="section-max flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-foreground">reflex</p>
          <p className="mt-1 text-sm text-muted">{PRODUCT_DEFINITION}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-6 text-sm text-muted">
            <li>
              <a
                href={GITHUB_URL}
                className="transition-colors hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a href="#local-runtime" className="transition-colors hover:text-foreground">
                Local runtime
              </a>
            </li>
            <li>
              <a href="#install-command" className="transition-colors hover:text-foreground">
                Install
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="section-max mt-8 font-mono text-xs text-muted">
        © {new Date().getFullYear()} Reflex · MIT License
      </p>
    </footer>
  );
}
