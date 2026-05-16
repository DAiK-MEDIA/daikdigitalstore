import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowRight, ShieldCheck, Globe, Clock, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Plan {
  id: string;
  size_label: string;
  size_gb: number;
  price: number;
}

const LandingPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plans?type=client`);
        const data = Array.isArray(response.data) ? response.data : [];
        setPlans(data);
        if (data.length > 0) setSelectedPlan(data[0]);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();

    const client = supabase as any;
    const subscription = client
      .channel('public:data_plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_plans' }, () => {
        fetchPlans();
      })
      .subscribe();

    return () => {
      client.removeChannel(subscription);
    };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { scale: 0.9, opacity: 0 },
    show: { scale: 1, opacity: 1 }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy p-8 md:p-16 lg:p-24 text-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[80%] bg-yellow/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[40%] h-[60%] bg-blue-400/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-yellow text-sm font-bold backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            Important Service Information
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight"
          >
            Premium Data Bundles & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow to-yellow/60">
              AFA Registration Services
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Access high-speed MTN and Telecel data bundles at competitive rates.
            We provide reliable connectivity for your personal and business needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
              <Clock className="w-5 h-5 text-yellow mb-2" />
              <h4 className="text-white font-bold text-sm">Fulfillment</h4>
              <p className="text-white/60 text-xs">Orders outside business hours are processed next session.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
              <ShieldCheck className="w-5 h-5 text-yellow mb-2" />
              <h4 className="text-white font-bold text-sm">SIM Compatibility</h4>
              <p className="text-white/60 text-xs">Excludes Turbonet, Broadband, Merchant, & Ported SIMs.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
              <CreditCard className="w-5 h-5 text-yellow mb-2" />
              <h4 className="text-white font-bold text-sm">Account Status</h4>
              <p className="text-white/60 text-xs">Outstanding balances must be settled prior to purchase.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-navy uppercase tracking-tighter">Select Your Bundle</h2>
          <p className="text-on-surface-variant font-medium">Click a plan to see its price and activate instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left: Compact Button Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-16 bg-surface-container animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    variants={item}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "h-16 rounded-2xl font-black text-xl transition-all duration-300 border-2",
                      selectedPlan?.id === plan.id
                        ? "bg-navy text-yellow border-navy shadow-lg scale-105"
                        : "bg-white text-navy border-surface-highest hover:border-navy hover:scale-105"
                    )}
                  >
                    MTN {plan.size_label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: Focused Detail Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedPlan ? (
                <motion.div
                  key={selectedPlan.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6 rounded-[2rem] border-2 border-navy bg-white shadow-2xl relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Selected Bundle</span>
                        <h3 className="text-4xl font-black text-navy">MTN {selectedPlan.size_label}</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-on-surface-variant">GHS</span>
                          <span className="text-6xl font-black text-navy tracking-tighter">{selectedPlan.price}</span>
                        </div>

                        <div className="flex items-center gap-2 text-on-surface-variant font-bold text-sm">
                          <div className="w-2 h-2 rounded-full bg-navy" />
                          Valid for 90 Days
                        </div>

                        <Button
                          type="button"
                          className="w-full h-14 rounded-2xl text-lg shadow-xl hover:scale-[1.02] transition-transform"
                          onClick={() => navigate(`/checkout/${selectedPlan.id}?type=client`)}
                        >
                          Buy This Bundle
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center border-2 border-dashed border-surface-highest rounded-[2.5rem]">
                  <p className="text-on-surface-variant font-bold">Select a data bundle from the left to continue.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Globe, title: "Stable Network", desc: "Always connected, everywhere in Ghana." },
          { icon: Clock, title: "24/7 Support", desc: "Our team is always here to help you." },
          { icon: CreditCard, title: "Flexible Pay", desc: "Pay with MoMo or any card seamlessly." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2rem] bg-white border border-surface-highest shadow-premium hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center mb-6">
              <feat.icon className="w-6 h-6 text-yellow" />
            </div>
            <h3 className="text-xl font-black text-navy mb-2">{feat.title}</h3>
            <p className="text-on-surface-variant font-medium">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Trust Banner */}
      <section className="bg-surface-container rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 border border-white shadow-inner">
        <h2 className="text-2xl font-black text-navy">Need Custom Solutions or Agent Access?</h2>
        <p className="text-on-surface-variant font-medium max-w-2xl mx-auto">
          We provide enterprise-level data solutions and wholesale agent pricing for business partners.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/partner-vault')}>Become an Agent</Button>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
