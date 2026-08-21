'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { fetchDeliveryRegions, DeliveryRegion, DeliveryTier } from '@/lib/db';
import { Card } from '../ui';
import { createClient } from '@/lib/supabase/client';

export default function Delivery() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRegion, setEditingRegion] = useState<DeliveryRegion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveryRegions();
      setRegions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegion = async (region: DeliveryRegion) => {
    try {
      // 1. Upsert region
      const { data: rData, error: rError } = await supabase.from('delivery_regions').upsert({
        id: region.id && !region.id.startsWith('new-') ? region.id : undefined,
        name: region.name,
        is_active: region.isActive,
      }).select().single();
      
      if (rError) throw rError;
      
      // 2. Delete existing tiers for this region if editing
      if (rData.id) {
        await supabase.from('delivery_tiers').delete().eq('region_id', rData.id);
      }
      
      // 3. Insert new tiers
      if (region.tiers.length > 0) {
        const tiersToInsert = region.tiers.map(t => ({
          region_id: rData.id,
          min_weight_grams: t.minWeightGrams,
          max_weight_grams: t.maxWeightGrams,
          charge: t.charge,
        }));
        const { error: tError } = await supabase.from('delivery_tiers').insert(tiersToInsert);
        if (tError) throw tError;
      }
      
      setIsAdding(false);
      setEditingRegion(null);
      loadData();
    } catch (e: any) {
      alert('Error saving region: ' + e.message);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this region?')) return;
    try {
      const { error } = await supabase.from('delivery_regions').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Error deleting region: ' + e.message);
    }
  };

  const renderEditor = () => {
    if (!editingRegion) return null;
    
    return (
      <Card className="p-6 mb-8 border-2 border-neutral-900 bg-[#faf9f6]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wide">
            {isAdding ? 'Add New Region' : 'Edit Region'}
          </h3>
          <button onClick={() => { setIsAdding(false); setEditingRegion(null); }} className="text-neutral-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-grow">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Region Name</label>
              <input 
                type="text" 
                value={editingRegion.name}
                onChange={e => setEditingRegion({...editingRegion, name: e.target.value})}
                placeholder="e.g. Tamil Nadu, All India"
                className="w-full bg-white border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-black/30"
              />
            </div>
            <div className="pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editingRegion.isActive}
                  onChange={e => setEditingRegion({...editingRegion, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-black/20 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm font-semibold">Active</span>
              </label>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-neutral-500">Weight Tiers (Grams)</h4>
              <button 
                onClick={() => setEditingRegion({
                  ...editingRegion, 
                  tiers: [...editingRegion.tiers, { id: `new-tier-${Date.now()}`, regionId: editingRegion.id, minWeightGrams: 0, maxWeightGrams: null, charge: 0 }]
                })}
                className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1.5 rounded-full hover:bg-neutral-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Tier
              </button>
            </div>
            
            <div className="border border-black/10 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-black/5">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="p-3">Min Weight (g)</th>
                    <th className="p-3">Max Weight (g)</th>
                    <th className="p-3">Charge (₹)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {editingRegion.tiers.map((tier, idx) => (
                    <tr key={tier.id}>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={tier.minWeightGrams}
                          onChange={e => {
                            const newTiers = [...editingRegion.tiers];
                            newTiers[idx].minWeightGrams = parseInt(e.target.value) || 0;
                            setEditingRegion({...editingRegion, tiers: newTiers});
                          }}
                          className="w-24 bg-[#F5F2EB] border border-black/5 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-black/20"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={tier.maxWeightGrams === null ? '' : tier.maxWeightGrams}
                          placeholder="Infinity"
                          onChange={e => {
                            const newTiers = [...editingRegion.tiers];
                            newTiers[idx].maxWeightGrams = e.target.value ? parseInt(e.target.value) : null;
                            setEditingRegion({...editingRegion, tiers: newTiers});
                          }}
                          className="w-24 bg-[#F5F2EB] border border-black/5 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-black/20 placeholder:text-neutral-400"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={tier.charge}
                          onChange={e => {
                            const newTiers = [...editingRegion.tiers];
                            newTiers[idx].charge = parseInt(e.target.value) || 0;
                            setEditingRegion({...editingRegion, tiers: newTiers});
                          }}
                          className="w-24 bg-[#F5F2EB] border border-black/5 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-black/20"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button 
                          onClick={() => {
                            const newTiers = editingRegion.tiers.filter((_, i) => i !== idx);
                            setEditingRegion({...editingRegion, tiers: newTiers});
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {editingRegion.tiers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-xs text-neutral-400">No tiers defined. Orders falling in this region will be free.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={() => handleSaveRegion(editingRegion)}
              className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 flex items-center gap-2 shadow-lg"
            >
              <Save className="w-3.5 h-3.5" /> Save Region
            </button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Delivery Management</h2>
          <p className="text-xs text-neutral-500 mt-1">Configure weight-based shipping rates by region</p>
        </div>
        {!isAdding && !editingRegion && (
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingRegion({
                id: `new-region-${Date.now()}`,
                name: '',
                isActive: true,
                tiers: [{ id: `new-tier-${Date.now()}`, regionId: `new-region-${Date.now()}`, minWeightGrams: 0, maxWeightGrams: null, charge: 0 }]
              });
            }}
            className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-neutral-800 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Region
          </button>
        )}
      </div>

      {renderEditor()}

      {!isAdding && !editingRegion && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map(region => (
            <Card key={region.id} className="p-5 flex flex-col h-full border border-black/5 hover:border-black/10 transition-colors bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{region.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${region.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {region.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setIsAdding(false); setEditingRegion(region); }} className="p-2 text-neutral-400 hover:text-black bg-[#F5F2EB] rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteRegion(region.id)} className="p-2 text-neutral-400 hover:text-red-500 bg-[#F5F2EB] rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-grow mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Weight Brackets</p>
                <div className="space-y-1.5">
                  {region.tiers.length > 0 ? (
                    region.tiers.map((t, i) => (
                      <div key={t.id} className="flex justify-between text-sm py-1 border-b border-black/5 last:border-0">
                        <span className="text-neutral-600">
                          {t.minWeightGrams}g - {t.maxWeightGrams === null ? '∞' : `${t.maxWeightGrams}g`}
                        </span>
                        <span className="font-semibold">₹{t.charge}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 italic">Free Shipping</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {!loading && regions.length === 0 && (
            <div className="col-span-full text-center py-12 text-neutral-500 border-2 border-dashed border-black/10 rounded-2xl">
              No delivery regions configured. Add one to enable shipping fees.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
