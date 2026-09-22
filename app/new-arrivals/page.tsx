'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  X, 
  RotateCcw, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  fetchProducts, 
  fetchDepartments, 
  formatAgeRange, 
  productMatchesDepartment, 
  Product, 
  Department 
} from '@/lib/db';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

function NewArrivalsContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state from URL query parameters
  useEffect(() => {
    const urlDept = searchParams.get('department');
    const urlSearch = searchParams.get('search');

    if (urlDept) setDepartmentFilter(urlDept);
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setSearchOpen(true);
    }
  }, [searchParams]);

  // Load products & departments
  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchDepartments()
    ]).then(([prodData, deptData]) => {
      setAllProducts(prodData);
      setDepartments(deptData.filter(d => d.isActive));
      setLoading(false);
    }).catch(async (err) => {
      console.error("Failed to load products for New Arrivals:", err);
      const prodData = await fetchProducts().catch(() => []);
      setAllProducts(prodData);
      setDepartments([
        { name: 'Men', isActive: true }, 
        { name: 'Women', isActive: true },
        { name: 'Kids', isActive: true }, 
        { name: 'Unisex', isActive: true },
      ]);
      setLoading(false);
    });
  }, []);

  // ALL products marked as New Arrival by the admin (p.isNew === true)
  const newArrivals = useMemo(() => {
    return allProducts.filter(p => p.isNew);
  }, [allProducts]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // URL query parameter sync
  const syncQueryParams = (dept: string, search: string) => {
    const params = new URLSearchParams();
    if (dept && dept !== 'All') params.set('department', dept);
    if (search && search.trim()) params.set('search', search.trim());

    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, '', targetUrl);
  };

  const handleDepartmentChange = (dept: string) => {
    setDepartmentFilter(dept);
    syncQueryParams(dept, searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    syncQueryParams(departmentFilter, val);
  };

  const handleResetFilters = () => {
    setDepartmentFilter('All');
    setSearchQuery('');
    setSearchOpen(false);
    syncQueryParams('All', '');
  };

  // Products filtered by selected department and optional search
  const filteredNewArrivals = useMemo(() => {
    return newArrivals.filter(p => {
      // Department filter
      if (departmentFilter !== 'All') {
        const dept = departments.find(d => d.name === departmentFilter);
        const deptMatch = dept 
          ? productMatchesDepartment(p, dept) 
          : (p.department === departmentFilter || (!p.department && departmentFilter === 'Unisex'));
        if (!deptMatch) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const deptMatch = p.department?.toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !descMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [newArrivals, departmentFilter, searchQuery, departments]);

  const hasActiveFilters = departmentFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="pt-20 sm:pt-28 md:pt-32 pb-20 sm:pb-24 max-w-7xl mx-auto px-3 sm:px-6 md:px-12">
        
        {/* Editorial Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/5 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold text-neutral-600 mb-2 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-neutral-800" />
            <span>Limited Drops & Fresh Cuts</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9] text-neutral-900 mb-2"
          >
            New <span className="font-serif italic lowercase font-normal text-black">Arrivals</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-neutral-500 max-w-lg text-xs sm:text-sm uppercase tracking-wider font-medium"
          >
            Explore our newest seasonal silhouettes and latest arrivals curated by our design house.
          </motion.p>
        </div>

        {/* Clean Sticky Header (Zero Category / Sorting Clutter) */}
        <div className="sticky top-14 sm:top-16 z-30 bg-[#F5F2EB]/95 backdrop-blur-md pt-2 pb-2.5 sm:py-3 mb-6 sm:mb-8 border-b border-black/[0.06] transition-all">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            
            {/* Department Segmented Tabs with smooth touch scrolling */}
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5 touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="inline-flex items-center gap-1 p-1 bg-black/[0.04] rounded-full">
                {['All', ...departments.map(d => d.name)].map(name => {
                  const isSelected = departmentFilter === name;
                  const deptObj = departments.find(d => d.name === name);
                  const ageLabel = deptObj ? formatAgeRange(deptObj.ageMinMonths, deptObj.ageMaxMonths) : '';

                  return (
                    <button
                      key={name}
                      onClick={() => handleDepartmentChange(name)}
                      className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-neutral-500 hover:text-black'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeNewArrivalDeptTab"
                          className="absolute inset-0 bg-neutral-900 rounded-full shadow-sm"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{name}</span>
                      {ageLabel && (
                        <span className={`relative z-10 ml-1 text-[8px] sm:text-[9px] px-1 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-neutral-400'
                        }`}>
                          {ageLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Piece Count, Search & Reset */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <span className="hidden sm:inline text-xs uppercase tracking-wider font-semibold text-neutral-400">
                {filteredNewArrivals.length} {filteredNewArrivals.length === 1 ? 'Piece' : 'Pieces'}
              </span>

              {/* Quick Search */}
              <div className="relative flex items-center">
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search drops..."
                      className="w-28 sm:w-52 pl-6 pr-6 py-1.5 bg-white border border-black/15 rounded-full text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-black transition-all shadow-2xs"
                    />
                    <Search className="w-3 h-3 text-neutral-400 absolute left-2 pointer-events-none" />
                    <button
                      onClick={() => {
                        handleSearchChange('');
                        setSearchOpen(false);
                      }}
                      className="absolute right-2 text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black bg-white/80 hover:bg-white border border-black/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    aria-label="Open search"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                )}
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-black hover:underline px-1.5 py-1 cursor-pointer"
                  aria-label="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-28 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-neutral-400">
              Loading New Arrivals
            </span>
          </div>
        ) : (
          <>
            {filteredNewArrivals.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-4 max-w-md mx-auto flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mb-4 text-neutral-400">
                  <Sparkles className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-neutral-900 mb-2">
                  No New Arrivals Found
                </h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  {newArrivals.length === 0 
                    ? "Our latest drops are currently being prepared by the studio. Explore the complete collection in the meantime."
                    : "No pieces match your selected department."
                  }
                </p>
                <Link
                  href="/products"
                  className="bg-black text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                layout
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
              >
                {filteredNewArrivals.map((prod) => {
                  const primaryImg = prod.images?.find(i => i.isPrimary)?.url || prod.images?.[0]?.url || prod.image || '';

                  return (
                    <ProductCard
                      key={prod.id}
                      id={prod.id}
                      title={prod.name}
                      category={prod.department ? `${prod.department} • ${prod.category}` : prod.category}
                      price={prod.price.toLocaleString('en-IN')}
                      isNew={prod.isNew}
                      discount={prod.discountLabel}
                      image={primaryImg}
                      stock={prod.stock}
                    />
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function NewArrivalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <NewArrivalsContent />
    </Suspense>
  );
}
