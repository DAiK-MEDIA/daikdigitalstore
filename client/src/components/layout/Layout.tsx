import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { supabase } from '../../services/supabase';
import { Info, X, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [broadcast, setBroadcast] = useState<{ message: string, active: boolean } | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .in('key', ['broadcast_message', 'broadcast_active', 'whatsapp_link']);

        if (!error && data) {
          const message = data.find(s => s.key === 'broadcast_message')?.value || '';
          const activeValue = data.find(s => s.key === 'broadcast_active')?.value;
          const active = activeValue === 'true' || activeValue === true;
          const waLink = data.find(s => s.key === 'whatsapp_link')?.value || '';
          
          setBroadcast({ message, active });
          setWhatsapp(waLink);
        }
      } catch (err) {
        console.error('Broadcast fetch error:', err);
      }
    };

    fetchBroadcast();

    const subscription = supabase
      .channel('public:admin_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, () => {
        fetchBroadcast();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface font-inter">
      <AnimatePresence>
        {broadcast?.active && showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow text-navy py-2.5 px-4 overflow-hidden relative"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 pr-8">
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-sm font-bold text-center leading-tight">
                {broadcast.message}
              </p>
              <button 
                onClick={() => setShowBanner(false)}
                className="absolute right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-surface-highest py-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-on-surface-variant font-medium">
            © {new Date().getFullYear()} DAIK. All rights reserved.
          </p>
          <div className="flex justify-center gap-6">
            <a href="/staff-hq/login" className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest opacity-10 hover:opacity-100 transition-opacity">
              Staff
            </a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Support Icon */}
      {whatsapp && (
        <a 
          href={whatsapp} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all group flex items-center justify-center"
          aria-label="WhatsApp Support"
        >
          <MessageCircle className="w-7 h-7" />
          {/* Tooltip on hover (desktop only) */}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
            Need Help?
          </span>
        </a>
      )}
    </div>
  );
};

export default Layout;
