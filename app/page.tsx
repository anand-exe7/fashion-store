import { Navbar } from '@/components/layout/Navbar';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Hero } from '@/components/home/Hero';
import { NewArrivals } from '@/components/home/NewArrivals';
import { Marquee } from '@/components/home/Marquee';

import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ShoppableLook } from '@/components/home/ShoppableLook';

import { BestSellers } from '@/components/home/BestSellers';
import { Features } from '@/components/home/Features';
import { LovedByThousands } from '@/components/home/LovedByThousands';
import { Instagram } from '@/components/home/Instagram';
import { Newsletter } from '@/components/home/Newsletter';
import { Footer } from '@/components/layout/Footer';

export default async function Home() {
  // Artificial delay to perfectly match the 2-second curtain animation
  await new Promise(resolve => setTimeout(resolve, 2100));

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <ScrollProgress />
      <Navbar />
      <Hero />
      <NewArrivals />
      <Marquee />

      <CategoryGrid />
      <ShoppableLook />

      <BestSellers />
      <Features />
      <LovedByThousands />
      <Instagram />
      <Newsletter />
      <Footer />
    </div>
  );
}
