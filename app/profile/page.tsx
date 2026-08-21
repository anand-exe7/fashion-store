'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { User, MapPin, Package, Settings, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/db';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${MON[Number(m) - 1]} ${Number(d)}, ${y}`;
};

export default function ProfilePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [addressInput, setAddressInput] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          window.location.href = '/login?next=/profile';
          return;
        }

        // Fetch user profile info
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setProfile({
          id: session.user.id,
          name: userProfile?.name || session.user.user_metadata?.full_name || 'Customer',
          email: session.user.email,
          phone: userProfile?.mobile || 'Not provided',
          address: userProfile?.address || '',
          role: userProfile?.role || 'user',
          memberSince: fmtDate(userProfile?.created_at || session.user.created_at),
        });
        if (userProfile?.address) setAddressInput(userProfile.address);

        // Fetch orders linked to this email
        const { data: userOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_email', session.user.email)
          .order('created_at', { ascending: false });

        if (userOrders) {
          const mappedOrders = userOrders.map(o => ({
            id: o.id,
            customerName: o.customer_name,
            customerEmail: o.customer_email,
            customerPhone: o.customer_phone,
            source: o.source,
            subtotal: o.subtotal,
            discount: o.discount,
            delivery: o.delivery,
            total: o.total,
            status: o.status,
            createdAt: o.created_at,
            items: o.order_items || []
          }));
          setOrders(mappedOrders as Order[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfileData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleSaveAddress = async () => {
    if (!profile?.id) return;
    setSavingAddress(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: profile.id,
          email: profile.email,
          name: profile.name,
          mobile: profile.phone !== 'Not provided' ? profile.phone : null,
          address: addressInput 
        });
      
      if (!error) {
        setProfile({ ...profile, address: addressInput });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Loading Profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-12 border-b border-black/10 pb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">My Account</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Sidebar / Profile Card */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#F5F2EB] shadow-md bg-neutral-200 flex items-center justify-center">
                   <User className="w-16 h-16 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">{profile?.name}</h2>
                <p className="text-sm text-neutral-500 mb-6">{profile?.email}</p>
                <div className="w-full bg-[#F5F2EB] rounded-lg py-3 px-4 mb-6 text-xs text-neutral-600 font-medium uppercase tracking-widest text-left flex justify-between">
                  <span>Member Since</span>
                  <span className="text-black font-bold">{profile?.memberSince}</span>
                </div>
                
                <button 
                  onClick={handleSignOut}
                  className="w-full h-12 bg-transparent text-red-500 border border-red-100 rounded-full flex items-center justify-center font-bold tracking-[0.1em] text-[10px] uppercase hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex flex-col gap-1">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-4 p-4 rounded-xl font-medium text-sm transition-colors ${activeTab === 'orders' ? 'bg-neutral-100 text-black' : 'hover:bg-neutral-50 text-neutral-600 hover:text-black'}`}
                >
                  <Package className="w-5 h-5" />
                  Order History
                </button>
                <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-4 p-4 rounded-xl font-medium text-sm transition-colors ${activeTab === 'addresses' ? 'bg-neutral-100 text-black' : 'hover:bg-neutral-50 text-neutral-600 hover:text-black'}`}
                >
                  <MapPin className="w-5 h-5" />
                  Addresses
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-2/3 flex flex-col gap-10">
              
              {activeTab === 'orders' && (
                <>
                  {/* Personal Information Summary */}
                  <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                    <h3 className="text-xl font-bold tracking-tight mb-8">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Full Name</p>
                        <p className="text-base font-semibold">{profile?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Email Address</p>
                        <p className="text-base font-semibold">{profile?.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Phone Number</p>
                        <p className="text-base font-semibold">{profile?.phone}</p>
                      </div>
                    </div>
                  </section>

                  {/* Recent Orders */}
                  <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold tracking-tight">Recent Orders</h3>
                    </div>
                    
                    {orders.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-black/10 rounded-xl bg-[#F5F2EB]">
                        <p className="text-sm text-neutral-500">You haven't placed any orders yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {orders.map((order, idx) => {
                          const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-black/10 hover:border-black/30 transition-colors group cursor-pointer">
                              <div className="flex flex-col gap-1 mb-4 sm:mb-0">
                                <span className="font-bold">{order.id}</span>
                                <span className="text-xs text-neutral-500">{fmtDate(order.createdAt)} • {totalItems} Items</span>
                              </div>
                              <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                                <div className="flex flex-col sm:items-end gap-1">
                                  <span className="font-bold">₹{order.total.toLocaleString()}</span>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${order.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {order.status}
                                  </span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'addresses' && (
                <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                  <h3 className="text-xl font-bold tracking-tight mb-8">Shipping Address</h3>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-500">Your saved address will automatically be used during checkout.</p>
                    <textarea 
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Enter your full delivery address..."
                      className="w-full h-32 p-4 rounded-xl border border-black/10 focus:border-black outline-none resize-none text-sm"
                    />
                    <button 
                      onClick={handleSaveAddress}
                      disabled={savingAddress}
                      className="self-start px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
