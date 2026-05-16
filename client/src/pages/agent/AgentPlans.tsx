import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../services/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowRight, Star, TrendingDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Badge from '../../components/ui/Badge';

interface Plan {
  id: string;
  size_label: string;
  size_gb: number;
  price: number;
}

const AgentPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = sessionStorage.getItem('agent_auth');
    if (!isAuth) {
      navigate('/partner-vault');
      return;
    }

    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plans?type=agent`);
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
      .channel('public:agent_data_plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_plans' }, () => {
        fetchPlans();
      })
      .subscribe();

    return () => {
      client.removeChannel(subscription);
    };
  }, [navigate]);

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
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-navy text-white p-10 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow opacity-10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-yellow font-bold text-sm uppercase tracking-widest">
            <Star className="w-4 h-4 fill-yellow" />
            Agent Pricing Active
          </div>
          <h1 className="text-4xl font-black">Reseller Dashboard</h1>
          <p className="text-white/70 max-w-lg font-medium">
            Purchase bundles at wholesale prices to maximize your business margins.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/10">
          <TrendingDown className="w-6 h-6 text-yellow" />
          <div>
            <p className="text-xs font-bold opacity-60 uppercase">Wholesale Edge</p>
            <p className="text-lg font-black text-yellow">Preferred Rates</p>
          </div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto space-y-12 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left: Compact Button Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Available Inventory</h2>
              <p className="text-on-surface-variant font-medium text-sm">Select a volume to view your agent price.</p>
            </div>

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
                animate="show"
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
                    {plan.size_label}
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
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Agent Bundle</span>
                          <h3 className="text-4xl font-black text-navy">{selectedPlan.size_label}</h3>
                        </div>
                        <Badge variant="processing" className="bg-success/10 text-success border-success/20">Agent Rate</Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-on-surface-variant">GHS</span>
                          <span className="text-6xl font-black text-navy tracking-tighter">{selectedPlan.price}</span>
                        </div>

                        <div className="flex items-center gap-2 text-on-surface-variant font-bold text-sm">
                          <Sparkles className="w-4 h-4 text-yellow" />
                          Wholesale Rate Applied
                        </div>

                        <Button
                          className="w-full h-14 rounded-2xl text-lg shadow-xl hover:scale-[1.02] transition-transform"
                          onClick={() => navigate(`/checkout/${selectedPlan.id}?type=agent`)}
                        >
                          Purchase Bundle
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center border-2 border-dashed border-surface-highest rounded-[2.5rem]">
                  <p className="text-on-surface-variant font-bold">Select a bundle to view agent pricing.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgentPlans;
