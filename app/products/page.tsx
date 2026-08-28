'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchProducts, fetchCategories, fetchDepartments, Product } from '@/lib/db';

export default function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [departments, setDepartments] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchDepartments()
    ]).then(([prodData, catData, deptData]) => {
      setProducts(prodData);
      
      const activeCats = catData.filter(c => c.isActive).map(c => c.name);
      setCategories(['All', ...activeCats]);
      
      const activeDepts = deptData.filter(d => d.isActive).map(d => d.name);
      setDepartments(['All', ...activeDepts]);
      
      setLoading(false);
    }).catch(async (err) => {
      console.error("Failed to load taxonomy, falling back to products only.", err);
      // Fallback: just load products and use defaults
      const prodData = await fetchProducts().catch(() => []);
      setProducts(prodData);
      
      const allCats = Array.from(new Set(prodData.map(p => p.category)));
      setCategories(['All', ...allCats]);
      setDepartments(['All', 'Men', 'Women', 'Kids', 'Unisex']);
      setLoading(false);
    });
  }, []);
  
  const filteredProducts = products.filter(p => {
    const categoryMatch = categoryFilter === 'All' || p.category === categoryFilter;
    // For legacy products without a department, we treat them as matching 'All' or 'Unisex'
    const deptMatch = departmentFilter === 'All' || p.department === departmentFilter || (!p.department && departmentFilter === 'Unisex');
    return categoryMatch && deptMatch;
  });

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-neutral-900 font-sans selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="pt-32 pb-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col items-center mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-light tracking-widest uppercase mb-4 text-[#3c3c3a]"
          >
            The <span className="font-serif italic lowercase text-6xl md:text-8xl">Collection</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-500 max-w-lg text-sm uppercase tracking-wider"
          >
            Explore our meticulously curated selection of timeless essentials.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 py-2 mr-2 hidden md:block">Department</span>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-full border ${departmentFilter === dept ? 'bg-black text-white border-black shadow-md' : 'bg-transparent text-neutral-600 border-black/10 hover:border-black/30 bg-white/50'}`}
              >
                {dept}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 py-2 mr-2 hidden md:block">Category</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-full border ${categoryFilter === cat ? 'bg-black text-white border-black shadow-md' : 'bg-transparent text-neutral-600 border-black/10 hover:border-black/30 bg-white/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-24 text-neutral-500 text-xs tracking-widest uppercase font-bold">
            Loading Collection...
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((prod, i) => {
              // Find the primary image, or fallback to first image, or legacy image
              const primaryImg = prod.images.find(img => img.isPrimary)?.url || prod.images[0]?.url || prod.image || '';

              return (
                <motion.div 
                  key={prod.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group cursor-pointer flex flex-col"
                  onClick={() => window.location.href = `/product/${prod.id}`}
                >
                  <div className="aspect-[3/4] bg-white/50 rounded-xl mb-5 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <span className="bg-white/90 backdrop-blur-md text-black text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-full shadow-lg">Quick View</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold tracking-wide text-[#3c3c3a]">{prod.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                        {prod.department ? `${prod.department} • ` : ''}{prod.category}
                      </p>
                    </div>
                    <p className="text-sm font-medium tracking-tight">₹{prod.price.toLocaleString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-24 text-neutral-500">
            No products found in this category.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
