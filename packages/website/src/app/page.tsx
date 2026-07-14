import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { HowItWorks } from '@/components/HowItWorks';
import { WhatRunsLocally } from '@/components/WhatRunsLocally';
import { Privacy } from '@/components/Privacy';
import { Install } from '@/components/Install';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ScrollReveal>
        <Problem />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <WhatRunsLocally />
      </ScrollReveal>
      <ScrollReveal>
        <Privacy />
      </ScrollReveal>
      <ScrollReveal>
        <Install />
      </ScrollReveal>
      <ScrollReveal>
        <FAQ />
      </ScrollReveal>
      <Footer />
    </main>
  );
}
