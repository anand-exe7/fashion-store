import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { NewArrivals } from '@/components/home/NewArrivals';
import { Marquee } from '@/components/home/Marquee';
import { SeasonalDrop } from '@/components/home/SeasonalDrop';
import { Categories } from '@/components/home/Categories';
import { Banner } from '@/components/home/Banner';
import { BestSellers } from '@/components/home/BestSellers';
import { Features } from '@/components/home/Features';
import { LovedByThousands } from '@/components/home/LovedByThousands';
import { Instagram } from '@/components/home/Instagram';
import { Newsletter } from '@/components/home/Newsletter';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <NewArrivals />
      <Marquee />
      <SeasonalDrop />
      <Categories />
      <Banner />
      <BestSellers />
      <Features />
      <LovedByThousands />
      <Instagram />
      <Newsletter />
      <Footer />
    </div>
  );
}
