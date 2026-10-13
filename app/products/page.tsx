'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { listingPrice } from '@/lib/price';
import { withTimeout, isTimeout } from '@/lib/withTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  Search, 
  X, 
  ArrowUpDown, 
  RotateCcw, 
  SlidersHorizontal,
  ArrowRight,
  Check
} from 'lucide-react';
import { 
  fetchCatalogue, 
  fetchCategories, 
  fetchDepartments, 
  formatAgeRange, 
  productMatchesDepartment, 
  Product, 
  Department 
} from '@/lib/db';

// The client wants the department filter in age order — Toddlers → Kids → Teens —
// not the DB's alphabetical order (Kids, Teens, Toddlers). Rank the known kid
// groups explicitly so the order holds even when age ranges aren't set on the
// departments; anything else falls back to its configured min age, then name.
function departmentRank(d: Department): number {
  const n = d.name.toLowerCase();
  if (n.includes('toddler')) return 0;
  if (n.includes('kid')) return 1;
  if (n.includes('teen')) return 2;
  if (d.ageMinMonths != null) return 100 + d.ageMinMonths;
  return 1000;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  // Set when the load gave up rather than failed — the page offers Retry
  // instead of spinning forever.
  const [loadError, setLoadError] = useState(false);

  const categoryRailRef = useRef<HTMLDivElement>(null);
  const activeBubbleRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state from URL query parameters
  useEffect(() => {
    const urlDept = searchParams.get('department');
    const urlCat = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    const urlSort = searchParams.get('sort');

    if (urlDept) setDepartmentFilter(urlDept);
    if (urlCat) setCategoryFilter(urlCat);
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setSearchOpen(true);
    }
    if (urlSort) setSortBy(urlSort);
  }, [searchParams]);

  // Load products, categories, and departments
  const loadData = useCallback(async () => {
    try {
      const [prodData, catData, deptData] = await withTimeout(
        Promise.all([fetchCatalogue(), fetchCategories(), fetchDepartments()]),
      );
      setProducts(prodData);
      setCategories(['All', ...catData.filter(c => c.isActive).map(c => c.name)]);
      setDepartments(deptData.filter(d => d.isActive));
      setLoadError(false);
    } catch (err) {
      // Nothing came back at all. Retrying here would mean another full wait,
      // so hand it to the shopper as a Retry button instead.
      if (isTimeout(err)) {
        console.error('Collection load timed out.', err);
        setLoadError(true);
        return;
      }

      console.error("Failed to load taxonomy, falling back to products only.", err);
      let prodData: Product[] = [];
      try {
        prodData = await withTimeout(fetchCatalogue());
      } catch (retryErr) {
        console.error('Products load failed too.', retryErr);
        setLoadError(true);
        return;
      }
      setProducts(prodData);

      // Taxonomy is what failed, so fall back to the categories the loaded
      // products actually carry rather than to a fixed list.
      setCategories(['All', ...Array.from(new Set(prodData.map(p => p.category).filter(Boolean)))]);
      setDepartments([
        { name: 'Men', isActive: true }, 
        { name: 'Women', isActive: true },
        { name: 'Kids', isActive: true }, 
        { name: 'Unisex', isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // loadData's first statement is an await, so nothing is set synchronously
    // here — not the cascading-render pattern the rule guards against, and the
    // lint can't see through the call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const retryLoad = () => {
    setLoadError(false);
    setLoading(true);
    loadData();
  };

  // Smoothly center the active category bubble on mobile/desktop
  useEffect(() => {
    if (activeBubbleRef.current && categoryRailRef.current) {
      activeBubbleRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [categoryFilter]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Update browser URL query params
  const syncQueryParams = (dept: string, cat: string, search: string, sort: string) => {
    const params = new URLSearchParams();
    if (dept && dept !== 'All') params.set('department', dept);
    if (cat && cat !== 'All') params.set('category', cat);
    if (search && search.trim()) params.set('search', search.trim());
    if (sort && sort !== 'featured') params.set('sort', sort);

    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, '', targetUrl);
  };

  const handleDepartmentChange = (dept: string) => {
    setDepartmentFilter(dept);
    syncQueryParams(dept, categoryFilter, searchQuery, sortBy);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    syncQueryParams(departmentFilter, cat, searchQuery, sortBy);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    syncQueryParams(departmentFilter, categoryFilter, val, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    syncQueryParams(departmentFilter, categoryFilter, searchQuery, sort);
  };

  const handleResetFilters = () => {
    setDepartmentFilter('All');
    setCategoryFilter('All');
    setSearchQuery('');
    setSortBy('featured');
    setSearchOpen(false);
    setMobileDrawerOpen(false);
    syncQueryParams('All', 'All', '', 'featured');
  };

// Intelligent category matching between display categories and products
function productMatchesCategory(p: Product, catName: string): boolean {
  if (!catName || catName === 'All') return true;
  const c = catName.toLowerCase().trim();
  const pCat = (p.category || '').toLowerCase().trim();
  const pName = (p.name || '').toLowerCase().trim();
  const pDesc = (p.description || '').toLowerCase().trim();

  // Exact category match
  if (pCat === c) return true;

  // Curated category & substyle mappings
  if (c === 'over sized t-shirts') {
    return pCat === 't-shirts' && (pName.includes('oversize') || pDesc.includes('oversize'));
  }
  if (c === 'casual t-shirts') {
    return pCat === 't-shirts' && !pName.includes('oversize');
  }
  if (c === 'hoodies') {
    return pName.includes('hoodie') || pName.includes('hooded') || pCat.includes('hoodie');
  }
  if (c === 'party wear shirts') {
    return pCat === 'shirts' && (pName.includes('party') || pName.includes('satin') || pDesc.includes('party'));
  }
  if (c === 'casual shirts') {
    return pCat === 'shirts' && !pName.includes('party') && !pName.includes('satin');
  }
  if (c === 'baggy pants') {
    return pName.includes('baggy') && (pCat.includes('pant') || pCat.includes('jean') || pName.includes('pant') || pName.includes('denim'));
  }
  if (c === 'formal pants') {
    return pName.includes('formal') || pName.includes('trouser');
  }
  if (c === 'cargo pants') {
    return pName.includes('cargo') && (pCat.includes('pant') || pCat.includes('jean') || pName.includes('pant') || pName.includes('jogger'));
  }
  if (c === 'sweat pants') {
    return pName.includes('jogger') || pName.includes('sweat') || pCat.includes('sweat');
  }
  if (c === 'shorts') {
    return pName.includes('short') || pCat.includes('short');
  }
  if (c === 'sweat t-shirts') {
    return pName.includes('sweatshirt') || pName.includes('sweat t-shirt');
  }
  if (c === 'jackets') {
    return pCat === 'jackets' || pName.includes('jacket');
  }
  if (c === 'accessories') {
    return pCat === 'accessories' || pName.includes('accessory') || pName.includes('belt') || pName.includes('wallet') || pName.includes('watch');
  }

  return pCat.includes(c) || c.includes(pCat);
}

  // Departments in the client's requested age order for the filter tabs/drawer.
  const orderedDepartments = useMemo(
    () => [...departments].sort((a, b) => departmentRank(a) - departmentRank(b) || a.name.localeCompare(b.name)),
    [departments],
  );

  // Products filtered by selected department
  const departmentFilteredProducts = useMemo(() => {
    return products.filter(p => {
      if (departmentFilter === 'All') return true;
      const dept = departments.find(d => d.name === departmentFilter);
      return dept 
        ? productMatchesDepartment(p, dept) 
        : (p.department === departmentFilter || (!p.department && departmentFilter === 'Unisex'));
    });
  }, [products, departmentFilter, departments]);

  // Dynamic category counts that update with department
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: departmentFilteredProducts.length,
    };
    categories.forEach(cat => {
      if (cat !== 'All') {
        counts[cat] = departmentFilteredProducts.filter(
          p => productMatchesCategory(p, cat)
        ).length;
      }
    });
    return counts;
  }, [departmentFilteredProducts, categories]);

  // Final filtered and sorted products list
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      // Department filter
      if (departmentFilter !== 'All') {
        const dept = departments.find(d => d.name === departmentFilter);
        const deptMatch = dept 
          ? productMatchesDepartment(p, dept) 
          : (p.department === departmentFilter || (!p.department && departmentFilter === 'Unisex'));
        if (!deptMatch) return false;
      }

      // Category filter
      if (categoryFilter !== 'All') {
        if (!productMatchesCategory(p, categoryFilter)) return false;
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

    // Sorting
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [products, departmentFilter, categoryFilter, searchQuery, sortBy, departments]);

  const activeFiltersCount = (departmentFilter !== 'All' ? 1 : 0) + 
                             (categoryFilter !== 'All' ? 1 : 0) + 
                             (searchQuery.trim() !== '' ? 1 : 0) + 
                             (sortBy !== 'featured' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="pt-20 sm:pt-28 md:pt-32 pb-20 sm:pb-24 max-w-7xl mx-auto px-3 sm:px-6 md:px-12">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-12">
          <motion.span 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-1.5 sm:mb-2"
          >
            Curated Wardrobe
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.95] text-neutral-900"
          >
            All <span className="font-serif italic lowercase font-normal">Products</span>
          </motion.h1>
        </div>

        {/* 1. Category rail — word chips, not photos. The old version showed a
            circular image per category pulled from a hardcoded menswear list, so
            a kidswear store rendered ten irrelevant tiles all reading "0". These
            are the live categories from the Taxonomy screen (active ones only). */}
        <div className="mb-6 sm:mb-8">
          <div
            ref={categoryRailRef}
            className="-mx-4 px-4 sm:-mx-2 sm:px-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth scroll-pl-4 sm:scroll-pl-2 py-2 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map(cat => {
              const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
              const count = categoryCounts[cat] ?? 0;
              const isEmpty = count === 0 && cat !== 'All';

              return (
                <button
                  key={cat}
                  ref={isSelected ? activeBubbleRef : null}
                  onClick={() => handleCategoryChange(cat)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F2EB] ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : isEmpty
                        ? 'border-black/[0.08] bg-transparent text-neutral-400 hover:border-black/20 hover:text-neutral-600'
                        : 'border-black/[0.1] bg-white text-neutral-700 hover:border-neutral-900 hover:text-black'
                  }`}
                >
                  <span className="whitespace-nowrap">{cat}</span>
                  <span className={`font-mono text-[9px] tabular-nums ${
                    isSelected ? 'text-white/60' : 'text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sticky Filter & Sort Bar */}
        <div className="sticky top-14 sm:top-16 z-30 bg-[#F5F2EB]/95 backdrop-blur-md py-2.5 sm:py-3.5 border-y border-black/10 mb-8 sm:mb-10 transition-all">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            
            {/* Desktop / Tablet Department Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-black/[0.04] p-1 rounded-full overflow-x-auto no-scrollbar">
              {['All', ...orderedDepartments.map(d => d.name)].map(name => {
                const isSelected = departmentFilter === name;
                const deptObj = departments.find(d => d.name === name);
                const ageLabel = deptObj ? formatAgeRange(deptObj.ageMinMonths, deptObj.ageMaxMonths) : '';

                return (
                  <button
                    key={name}
                    onClick={() => handleDepartmentChange(name)}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeDeptTab"
                        className="absolute inset-0 bg-neutral-900 rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{name}</span>
                    {ageLabel && (
                      <span className={`relative z-10 ml-1 text-[9px] px-1 py-0.2 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-neutral-400'
                      }`}>
                        {ageLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Filter Button (Opens Bottom Drawer) */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-white text-black text-[8px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 rounded-full bg-white border border-black/10 text-neutral-600 hover:text-black cursor-pointer"
                  aria-label="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Right Controls: Count, Search & Sort */}
            <div className="flex items-center gap-1.5 sm:gap-4 ml-auto shrink-0">
              
              {/* Product Count on Desktop */}
              <span className="hidden md:inline text-xs uppercase tracking-wider font-semibold text-neutral-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'}
              </span>

              {/* Expandable Search Input */}
              <div className="relative flex items-center">
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search..."
                      className="w-28 sm:w-56 pl-6 pr-6 py-1.5 bg-white border border-black/15 rounded-full text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-black transition-all shadow-2xs"
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

              {/* Sort Selector */}
              <div className="relative flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  aria-label="Sort products by"
                  className="appearance-none bg-white/80 hover:bg-white border border-black/10 hover:border-black/25 rounded-full pl-2.5 pr-6 sm:pl-3.5 sm:pr-7 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-800 focus:outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Desktop Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="hidden sm:flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-black hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Product Grid: Consistent 3D Tilt ProductCard from Homepage */}
        {loading ? (
          <div className="text-center py-28 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400">
              Loading Collection
            </span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-black/5 text-neutral-400">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-neutral-900">
              Couldn&apos;t load the collection
            </h3>
            <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
              Check your internet connection and try again.
            </p>
            <button
              onClick={retryLoad}
              className="mt-1 flex items-center gap-2 rounded-full bg-black px-7 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-neutral-800 active:scale-95"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-4 max-w-md mx-auto flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mb-4 text-neutral-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-neutral-900 mb-2">
                  No Matching Items
                </h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  No pieces found for {categoryFilter !== 'All' ? `"${categoryFilter}"` : 'this search'} in {departmentFilter}. Try switching categories or clearing filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-black text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <span>View All Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
              >
                {filteredProducts.map((p) => {
                  const primaryImg = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || p.image || '';

                  return (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      title={p.name}
                      category={p.department ? `${p.department} • ${p.category}` : p.category}
                      price={listingPrice(p.price, p.variants).price}
                      priceFrom={listingPrice(p.price, p.variants).from}
                      originalPrice={p.originalPrice}
                      isNew={p.isNew}
                      discount={p.discountLabel}
                      image={primaryImg}
                      stock={p.stock}
                    />
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* 4. Mobile Filter Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 sm:hidden"
            />

            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 bg-[#F5F2EB] rounded-t-[2rem] p-6 z-50 sm:hidden max-h-[85vh] overflow-y-auto shadow-2xl border-t border-black/10"
            >
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
                    Filter & Sort
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {filteredProducts.length} pieces available
                  </p>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Department Section */}
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block mb-3">
                  Department
                </span>
                <div className="flex flex-wrap gap-2">
                  {['All', ...orderedDepartments.map(d => d.name)].map(name => {
                    const isSelected = departmentFilter === name;
                    return (
                      <button
                        key={name}
                        onClick={() => handleDepartmentChange(name)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                          isSelected 
                            ? 'bg-black text-white shadow-sm' 
                            : 'bg-white border border-black/10 text-neutral-700'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Section */}
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block mb-3">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => {
                    const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
                    const count = categoryCounts[cat] ?? 0;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border ${
                          isSelected 
                            ? 'bg-black text-white border-black font-bold' 
                            : 'bg-white border-black/10 text-neutral-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Section */}
              <div className="mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block mb-3">
                  Sort Order
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Featured', value: 'featured' },
                    { label: 'Price: Low-High', value: 'price-asc' },
                    { label: 'Price: High-Low', value: 'price-desc' },
                    { label: 'Newest First', value: 'newest' },
                  ].map(opt => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all text-center border ${
                          isSelected 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white border-black/10 text-neutral-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-3.5 rounded-full border border-black/15 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex-1 bg-black text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-center shadow-lg active:scale-95 transition-all"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
