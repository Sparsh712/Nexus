import Navbar from './components/Navbar';
import HeroParallaxModern from '@/components/HeroParallaxModern';
import FeaturesInteractive from '@/components/FeaturesInteractive';
import TestimonialsMarquee from '@/components/TestimonialsMarquee';
import MarketStats from '@/components/MarketStats';
import MarketIndices from '@/components/MarketIndices';
import MarketMovers from '@/components/MarketMovers';
import { Footer } from './components/Footer';
import Chatbot from './components/Chatbot';

export default function Home() {
  const selectedFund = {
    name: "NEXUS",
    code: "WP-001"
  };

  return (
    <main className="bg-black min-h-screen selection:bg-purple-500/30">
      <Navbar />
      <HeroParallaxModern />
      {/* Market Overview Section - Yahoo Finance inspired */}
      <section className="bg-gradient-to-b from-black via-[#050510] to-black py-4">
        <MarketIndices />
        <MarketMovers />
      </section>
      <FeaturesInteractive />
      <MarketStats />
      <TestimonialsMarquee />
      <Footer />
      <Chatbot selectedFund={selectedFund} />
    </main>
  );
}
