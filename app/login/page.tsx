'use client';
import { Navbar } from '@/components/layout/Navbar';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white rounded-3xl p-8 md:p-12 border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Welcome Back</h1>
            <p className="text-neutral-500 text-sm">Enter your credentials to access your account.</p>
          </div>
          
          <form className="flex flex-col gap-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="w-full bg-[#F5F2EB] border border-black/5 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-black/20 transition-colors placeholder:text-neutral-400" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2 flex justify-between">
                <span>Password</span>
                <a href="#" className="hover:text-black transition-colors">Forgot?</a>
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#F5F2EB] border border-black/5 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-black/20 transition-colors placeholder:text-neutral-400" 
              />
            </div>
            
            <button 
              type="button" 
              className="w-full h-14 mt-4 bg-black text-white rounded-full flex items-center justify-center font-bold tracking-[0.2em] text-[10px] uppercase hover:bg-neutral-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
            
            <div className="text-center mt-6">
              <p className="text-xs text-neutral-600">
                New to APEX? <a href="#" className="text-black hover:underline underline-offset-4 font-bold">Create an account</a>
              </p>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
