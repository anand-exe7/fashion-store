'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { User, MapPin, Package, Settings, ChevronRight } from 'lucide-react';
import { useAdminData, inr } from '@/lib/store';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${MON[Number(m) - 1]} ${Number(d)}, ${y}`;
};

export default function ProfilePage() {
  const { orders: storeOrders } = useAdminData();

  const user = {
    name: 'Jane Doe',
    email: 'test@shalistone.store',
    phone: '+1 (555) 123-4567',
    memberSince: 'August 2026',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
  };

  // Orders placed online (Razorpay) flow into the customer's history.
  const liveOrders = storeOrders
    .filter((o) => o.source === 'online')
    .map((o) => ({
      id: o.id,
      date: fmtDate(o.date),
      items: o.items.reduce((a, i) => a + i.qty, 0),
      total: inr(o.total),
      status: 'Confirmed',
    }));

  const fallback = [
    { id: 'INV-2026-9821XX', date: 'Aug 12, 2026', items: 2, total: '₹67,900', status: 'In Transit' },
    { id: 'INV-2026-8432XX', date: 'Jul 28, 2026', items: 1, total: '₹18,500', status: 'Delivered' },
  ];

  const orders = [...liveOrders, ...fallback].slice(0, 8);

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
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#F5F2EB] shadow-md">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">{user.name}</h2>
                <p className="text-sm text-neutral-500 mb-6">{user.email}</p>
                <div className="w-full bg-[#F5F2EB] rounded-lg py-3 px-4 mb-6 text-xs text-neutral-600 font-medium uppercase tracking-widest text-left flex justify-between">
                  <span>Member Since</span>
                  <span className="text-black font-bold">{user.memberSince}</span>
                </div>
                
                <button className="w-full h-12 bg-black text-white rounded-full flex items-center justify-center font-bold tracking-[0.1em] text-[10px] uppercase hover:bg-neutral-800 transition-colors shadow-sm mb-3">
                  Edit Profile
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full h-12 bg-transparent text-red-500 border border-red-100 rounded-full flex items-center justify-center font-bold tracking-[0.1em] text-[10px] uppercase hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex flex-col gap-1">
                <button className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F2EB] font-bold text-sm transition-colors">
                  <User className="w-5 h-5" />
                  Personal Info
                </button>
                <button className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-50 text-neutral-600 hover:text-black font-medium text-sm transition-colors">
                  <Package className="w-5 h-5" />
                  Order History
                </button>
                <button className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-50 text-neutral-600 hover:text-black font-medium text-sm transition-colors">
                  <MapPin className="w-5 h-5" />
                  Addresses
                </button>
                <button className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-50 text-neutral-600 hover:text-black font-medium text-sm transition-colors">
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-2/3 flex flex-col gap-10">
              
              {/* Personal Information */}
              <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight mb-8">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Full Name</p>
                    <p className="text-base font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Email Address</p>
                    <p className="text-base font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">Phone Number</p>
                    <p className="text-base font-semibold">{user.phone}</p>
                  </div>
                </div>
              </section>

              {/* Default Address */}
              <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold tracking-tight">Default Shipping</h3>
                  <button className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 text-neutral-500 hover:text-black transition-colors">Edit</button>
                </div>
                <div className="bg-[#F5F2EB] p-6 rounded-xl border border-black/5">
                  <p className="font-bold mb-1">{user.name}</p>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                    123 Shalistone Avenue, Suite 400<br/>
                    Beverly Hills, CA 90210<br/>
                    United States
                  </p>
                  <p className="text-xs text-neutral-500">Phone: {user.phone}</p>
                </div>
              </section>

              {/* Recent Orders */}
              <section className="bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold tracking-tight">Recent Orders</h3>
                  <button className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 text-neutral-500 hover:text-black transition-colors">View All</button>
                </div>
                <div className="flex flex-col gap-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-black/10 hover:border-black/30 transition-colors group cursor-pointer">
                      <div className="flex flex-col gap-1 mb-4 sm:mb-0">
                        <span className="font-bold">{order.id}</span>
                        <span className="text-xs text-neutral-500">{order.date} • {order.items} Items</span>
                      </div>
                      <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="font-bold">{order.total}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${order.status === 'Delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                            {order.status}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
