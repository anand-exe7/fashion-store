'use client';
import { useState } from 'react';
import { Plus, Search, Tags, Layers, Trash2 } from 'lucide-react';
import { useAdminData, updateCategory, deleteCategory, updateDepartment, showToast } from '@/lib/store';
import { Card, Modal, ModalHeader, Field, inputCls } from '../ui';
import { createClient } from '@/lib/supabase/client';

export default function Categories() {
  const { categories, departments } = useAdminData();
  const [query, setQuery] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const q = query.toLowerCase();
  
  const filteredDepts = departments.filter(d => !q || d.name.toLowerCase().includes(q));
  const filteredCats = categories.filter(c => !q || c.name.toLowerCase().includes(q));

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      showToast("Category already exists.");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('categories').insert({ name, is_active: true });
    
    if (error) {
      showToast("Failed to create category.");
    } else {
      showToast("Category created!");
      setAddingCategory(false);
      setNewCatName('');
      // Force reload of state by updating local cache
      // The store doesn't have an addCategory, so we just mutate and fetch
      window.location.reload(); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Taxonomy</h2>
          <p className="text-sm text-neutral-500">Manage Departments and Categories</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button onClick={() => setAddingCategory(true)} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search departments or categories…" className="w-full rounded-2xl border border-black/[0.06] bg-white py-3.5 pl-12 pr-4 text-sm font-medium shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-900 mb-2">
            <Layers className="h-5 w-5" />
            <h3 className="font-extrabold tracking-tight">Departments</h3>
          </div>
          {filteredDepts.length === 0 ? (
            <p className="text-sm text-neutral-500">No departments found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDepts.map(d => (
                <Card key={d.name} className="flex items-center justify-between p-4 bg-white">
                  <div>
                    <p className="font-bold text-neutral-900">{d.name}</p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Global Department</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={d.isActive} 
                        onChange={() => updateDepartment(d.name, !d.isActive)} 
                      />
                      <div className={`block h-6 w-10 rounded-full transition-colors ${d.isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                      <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${d.isActive ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-900 mb-2">
            <Tags className="h-5 w-5" />
            <h3 className="font-extrabold tracking-tight">Categories</h3>
          </div>
          {filteredCats.length === 0 ? (
            <p className="text-sm text-neutral-500">No categories found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCats.map(c => (
                <Card key={c.name} className="flex items-center justify-between p-4 bg-white">
                  <div>
                    <p className="font-bold text-neutral-900">{c.name}</p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Product Category</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={c.isActive} 
                          onChange={() => updateCategory(c.name, !c.isActive)} 
                        />
                        <div className={`block h-6 w-10 rounded-full transition-colors ${c.isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                        <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${c.isActive ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                    <button onClick={() => deleteCategory(c.name)} className="text-red-500 hover:text-red-600 transition-colors p-1" title="Delete Category">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={addingCategory} onClose={() => setAddingCategory(false)} size="sm">
        <ModalHeader title="Add Category" onClose={() => setAddingCategory(false)} />
        <div className="p-5">
          <Field label="Category Name">
            <input 
              className={inputCls} 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              placeholder="e.g. Activewear" 
              autoFocus 
            />
          </Field>
          <button 
            onClick={handleAddCategory} 
            className="mt-6 w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
          >
            Create Category
          </button>
        </div>
      </Modal>
    </div>
  );
}
