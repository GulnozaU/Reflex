'use client';

import { useEffect, useState } from 'react';

const steps = [
  {
    num: '01',
    title: 'Capture',
    body: 'Reflex observes your workflow locally — file edits, terminal commands, and session traces stored on your machine.'
  },
  {
    num: '02',
    title: 'Detect',
    body: 'It identifies repeated debugging patterns: test-fix loops, type-error cycles, and API/schema failures.'
  },
  {
    num: '03',
    title: 'Learn',
    body: 'After you approve, Reflex saves reusable fixes to `.local-patterns/patterns.json` in your project — plain JSON, no cloud.'
  },
  {
    num: '04',
    title: 'Replay',
    body: 'When a similar failure starts again, Reflex surfaces the saved fix before you rediscover it — status bar and measured cost framing.'
  }
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

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
          Four phases, one pipeline — from observation to memory, entirely local.
        </p>

        <div className="mt-10 hidden items-center gap-0 lg:flex" aria-hidden="true">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-1 items-center">
              <div
                className={`h-px flex-1 transition-colors duration-500 ${
                  i === 0 ? 'bg-transparent' : i <= activeStep ? 'bg-sage' : 'bg-line'
                }`}
              />
              <div
                className={`mx-2 h-2 w-2 shrink-0 rounded-full border transition-all duration-500 ${
                  i <= activeStep ? 'border-sage bg-sage' : 'border-line bg-card'
                }`}
              />
              <div
                className={`h-px flex-1 transition-colors duration-500 ${
                  i === steps.length - 1 ? 'bg-transparent' : i < activeStep ? 'bg-sage' : 'bg-line'
                }`}
              />
            </div>
          ))}
        </div>

        <ol className="mt-8 card-grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            return (
              <li
                key={step.num}
                className={`p-6 ${isActive ? 'border-l-2 border-l-sage !bg-[#262626]' : ''}`}
              >
                <span
                  className={`font-mono text-xs transition-colors duration-500 ${
                    isActive ? 'text-sage' : 'text-muted'
                  }`}
                >
                  {step.num}
                </span>
                <h3 className="mt-2 text-lg font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
