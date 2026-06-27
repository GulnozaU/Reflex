import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { HowItWorks } from '@/components/HowItWorks';
import { Privacy } from '@/components/Privacy';
import { Install } from '@/components/Install';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <Privacy />
      <Install />
      <FAQ />
      <Footer />
    </main>
  );
}
