import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { AlertTriangle, ChevronLeft, Phone, User } from 'lucide-react';

interface Plan {
  id: string;
  size_label: string;
  price: number;
}

const CheckoutPage = () => {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'client';
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlan = async () => {
      // Security check for agents
      if (userType === 'agent' && sessionStorage.getItem('agent_auth') !== 'true') {
        navigate('/partner-vault');
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plans?type=${userType}`);
        const foundPlan = response.data.find((p: Plan) => p.id === planId);
        
        if (foundPlan) {
          setPlan(foundPlan);
        } else {
          // If plan not found, redirect to home or plans
          navigate(userType === 'agent' ? '/partner-vault/plans' : '/');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        navigate('/');
      } finally {
        setIsLoaded(true);
      }
    };
    fetchPlan();
  }, [planId, userType, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        plan_id: planId,
        user_type: userType
      });
      navigate(`/payment/${response.data.id}`);
    } catch (err) {
      setError('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-4">
      <div className="w-12 h-12 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
      <p className="text-on-surface-variant font-bold">Verifying selection...</p>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-navy transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Plans
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Plan Summary */}
        <div className="md:col-span-1">
          <Card className="bg-navy text-white h-full flex flex-col justify-center text-center p-8">
            <span className="text-xs font-bold text-yellow uppercase tracking-widest mb-2">Selected Plan</span>
            <h3 className="text-4xl font-black mb-4">{plan.size_label}</h3>
            <div className="pt-4 border-t border-white/10">
              <span className="text-sm font-bold opacity-60">Price</span>
              <p className="text-2xl font-bold">GHS {plan.price}</p>
            </div>
          </Card>
        </div>

        {/* Checkout Form */}
        <div className="md:col-span-2">
          <Card className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-navy">Checkout</h2>
              <p className="text-sm text-on-surface-variant">Enter your details to proceed with the purchase.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Full Name"
                placeholder="Enter your full name"
                icon={<User className="w-4 h-4" />}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <Input 
                label="Phone Number"
                placeholder="024 000 0000"
                type="tel"
                icon={<Phone className="w-4 h-4" />}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                required
              />

              {/* Critical Disclaimer */}
              <div className="bg-error/5 border border-error/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                <p className="text-xs font-bold text-error leading-relaxed">
                  ⚠️ Double-check your number before proceeding. If you enter the wrong number, we cannot reverse the transaction.
                </p>
              </div>

              {error && <p className="text-sm text-error font-bold">{error}</p>}

              <Button 
                type="submit" 
                className="w-full py-4 text-lg" 
                isLoading={isLoading}
              >
                Proceed to Payment
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
