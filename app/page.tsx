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
import { fetchProducts } from '@/lib/db';
import { Suspense } from 'react';

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[3/4] w-full bg-black/[0.04] rounded-2xl animate-pulse" />
      <div className="flex justify-between px-1">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-black/[0.04] rounded animate-pulse" />
          <div className="h-3 w-20 bg-black/[0.04] rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-16 bg-black/[0.04] rounded px-1 animate-pulse" />
    </div>
  );
}

function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="h-10 w-48 bg-black/[0.04] rounded-lg animate-pulse mb-12 mx-auto" />
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count > 3 ? '4' : '3'} gap-8`}>
        {Array.from({ length: count }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

async function AsyncProducts() {
  const products = await fetchProducts();
  return (
    <>
      <NewArrivals products={products} />
      <Marquee />
      <CategoryGrid />
      <ShoppableLook />
      <BestSellers products={products} />
    </>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <ScrollProgress />
      <Navbar />
      <Hero />
      
      <Suspense fallback={
        <>
          <GridSkeleton count={3} />
          <GridSkeleton count={4} />
        </>
      }>
        <AsyncProducts />
      </Suspense>

      <Features />
      <LovedByThousands />
      <Instagram />
      <Newsletter />
      <Footer />
    </div>
  );
}
