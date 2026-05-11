import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Search, Info, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusPage = () => {
  const { orderRef: urlRef } = useParams();
  const navigate = useNavigate();
  const [searchRef, setSearchRef] = useState(urlRef || '');
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (ref: string) => {
    // Extract the original 7-digit ID if it's a Paystack reference (e.g., 1234567_timestamp)
    const cleanRef = ref.split('_')[0];
    
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${cleanRef}/status`);
      setOrder(response.data);
    } catch (err: any) {
      setError('Order not found. Please check your ID and try again.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (urlRef) {
      fetchStatus(urlRef);
    }
  }, [urlRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.length === 7) {
      navigate(`/status/${searchRef}`);
    } else {
      setError('Order ID must be 7 digits');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-8 h-8 text-pending" />;
      case 'processing': return <RefreshCw className="w-8 h-8 text-blue-500 animate-spin-slow" />;
      case 'delivered': return <CheckCircle2 className="w-8 h-8 text-success" />;
      case 'cancelled': return <XCircle className="w-8 h-8 text-error" />;
      default: return <AlertCircle className="w-8 h-8" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-navy text-center">Track Your Order</h2>
        <p className="text-on-surface-variant">Enter your 7-digit Order ID to check activation status.</p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input 
            placeholder="e.g. 4820193"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value.replace(/\D/g, '').substring(0, 7))}
            className="text-center text-xl font-bold tracking-widest h-14"
            disabled={isLoading}
          />
          <Button type="submit" isLoading={isLoading} className="h-14 px-8">
            <Search className="w-5 h-5" />
          </Button>
        </form>
        {error && <p className="text-sm text-error font-bold mt-2 text-center">{error}</p>}
      </Card>

      {order && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <Card className="relative overflow-hidden">
            {/* Background Accent */}
            <div className={cn(
              "absolute top-0 left-0 w-2 h-full",
              order.order_status === 'pending' && "bg-pending",
              order.order_status === 'processing' && "bg-blue-500",
              order.order_status === 'delivered' && "bg-success",
              order.order_status === 'cancelled' && "bg-error"
            )} />

            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Order Reference</span>
                <h3 className="text-2xl font-black text-navy">{order.order_ref}</h3>
              </div>
              <Badge variant={order.order_status}>{order.order_status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 py-6 border-y border-surface-highest">
              <div className="space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Customer Name</span>
                <p className="text-sm font-bold text-navy">{order.full_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Date</span>
                <p className="text-sm font-bold text-navy">
                  {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Bundle</span>
                <p className="text-lg font-bold text-navy">{order.data_plans.size_label}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Recipient</span>
                <p className="text-lg font-bold text-navy">{order.phone_number}</p>
              </div>
            </div>

            <div className="pt-8 flex flex-col items-center text-center space-y-4">
              {getStatusIcon(order.order_status)}
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-navy capitalize">Order {order.order_status}</h4>
                <p className="text-sm text-on-surface-variant px-8">
                  {order.order_status === 'pending' && "Your order is in the queue. Activation will start shortly."}
                  {order.order_status === 'processing' && "We are currently activating your data bundle. Please wait a few minutes."}
                  {order.order_status === 'delivered' && "Success! Your data bundle has been sent to your number."}
                  {order.order_status === 'cancelled' && "This order was cancelled. Please contact support for assistance."}
                </p>
              </div>
            </div>
          </Card>

          {order.notification_message && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-navy text-white border-none">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow text-navy flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-yellow">Admin Message</h5>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {order.notification_message}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Utils fix
import { cn } from '../../utils/cn';

export default StatusPage;
