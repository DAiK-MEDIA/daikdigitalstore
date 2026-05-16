import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CreditCard, Smartphone, MessageCircle, Info, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

interface Order {
  id: string;
  order_ref: string;
  amount_paid: number;
  phone_number: string;
  data_plans: { size_label: string };
}

const PaymentPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<'paystack' | 'momo'>('paystack');
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/id/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/settings/public`);
        setSettings(response.data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handlePaystack = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (order) {
        await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${order.id}/payment-method`, {
          method: 'paystack'
        });
      }
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/paystack/initialize/${orderId}`, {
        email: 'customer@example.com' // Placeholder
      });
      window.location.href = response.data.data.authorization_url;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to initialize payment. Please try again or use the MoMo option.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const buildWhatsAppUrl = (link: string | undefined, momoNumber: string | undefined, message: string) => {
    const cleanLink = link?.trim();
    const cleanNumber = momoNumber?.trim().replace(/\D/g, '');
    const isPlaceholderLink = !cleanLink || /0{6,}/.test(cleanLink) || cleanLink.toLowerCase().includes('example');

    if (cleanLink && !isPlaceholderLink) {
      return cleanLink.includes('?') ? `${cleanLink}&text=${encodeURIComponent(message)}` : `${cleanLink}?text=${encodeURIComponent(message)}`;
    }

    if (cleanNumber) {
      return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsApp = async () => {
    const currentOrder = order;
    if (!currentOrder) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${currentOrder.id}/payment-method`, {
        method: 'momo'
      });

      const message = `Hello, I want to make a MoMo payment for Order ID: ${currentOrder.order_ref}. Plan: ${currentOrder.data_plans?.size_label ?? 'N/A'}. Amount: GHS ${currentOrder.amount_paid}. Phone: ${currentOrder.phone_number}. Please guide me on how to proceed.`;
      const whatsappUrl = buildWhatsAppUrl(settings?.whatsapp_link, settings?.momo_number, message);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Failed to update payment method:', err);
      const message = `Hello, I want to make a MoMo payment for Order ID: ${currentOrder.order_ref}. Plan: ${currentOrder.data_plans?.size_label ?? 'N/A'}. Amount: GHS ${currentOrder.amount_paid}. Phone: ${currentOrder.phone_number}. Please guide me on how to proceed.`;
      const whatsappUrl = buildWhatsAppUrl(settings?.whatsapp_link, settings?.momo_number, message);
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!order) return <div className="text-center py-20">{error ? error : 'Loading order...'}</div>;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-navy">Secure Payment</h2>
        <p className="text-on-surface-variant">Choose your preferred method to complete the {order.data_plans?.size_label} purchase.</p>
      </div>

      <Card className="bg-navy/5 border-navy/10 text-center space-y-2 py-6">
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Order Reference ID</p>
        <p className="text-3xl font-black text-navy tracking-widest bg-white inline-block px-6 py-2 rounded-xl shadow-sm border border-surface-highest">
          {order.order_ref}
        </p>
        <p className="text-xs text-on-surface-variant font-medium pt-2 max-w-sm mx-auto">
          Please keep this ID safe. You will need it to track the status of your data bundle activation.
        </p>
      </Card>

      {/* Inline Error Card */}
      {error && (
        <div className="flex items-start gap-3 bg-error/5 border border-error/20 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-error text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Pay Online Option */}
        <button
          onClick={() => setMethod('paystack')}
          className={cn(
            "w-full text-left p-6 rounded-xl border-2 transition-all flex items-center justify-between group",
            method === 'paystack' ? "border-navy bg-navy/5" : "border-surface-highest bg-white hover:border-navy/30"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
              method === 'paystack' ? "bg-navy text-white" : "bg-surface-container text-on-surface-variant group-hover:bg-navy/10"
            )}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy">Pay Online</h4>
              <p className="text-sm text-on-surface-variant">Instant Activation via Paystack</p>
            </div>
          </div>
          {method === 'paystack' && <CheckCircle2 className="w-6 h-6 text-navy" />}
        </button>

        {/* Manual MoMo Option */}
        <button
          onClick={() => setMethod('momo')}
          className={cn(
            "w-full text-left p-6 rounded-xl border-2 transition-all flex items-center justify-between group",
            method === 'momo' ? "border-navy bg-navy/5" : "border-surface-highest bg-white hover:border-navy/30"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
              method === 'momo' ? "bg-navy text-white" : "bg-surface-container text-on-surface-variant group-hover:bg-navy/10"
            )}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy">Manual MoMo Transfer</h4>
              <p className="text-sm text-on-surface-variant">Up to 15 mins verification</p>
            </div>
          </div>
          {method === 'momo' && <CheckCircle2 className="w-6 h-6 text-navy" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {method === 'momo' ? (
          <motion.div
            key="momo-inst"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-surface-container border-none space-y-4">
              <div className="flex items-center gap-2 text-navy font-bold">
                <Info className="w-5 h-5" />
                Manual Transfer Instructions
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="text-sm">
                    <p className="text-on-surface-variant">Send <span className="font-bold text-navy">GHS {order.amount_paid}</span> to:</p>
                    <p className="text-lg font-black text-navy">{settings?.momo_number || 'Not configured'}</p>
                    <p className="text-xs font-bold opacity-60 uppercase">Merchant: DESMOND AMPONSAH</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="text-sm">
                    <p className="text-on-surface-variant">Use Reference:</p>
                    <p className="text-lg font-black text-navy">DH-{order.order_ref}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="text-sm">
                    <p className="text-on-surface-variant">Chat with us on WhatsApp for activation.</p>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              variant="secondary"
              className="w-full py-4"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="paystack-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              className="w-full py-4 text-lg"
              onClick={handlePaystack}
              isLoading={isLoading}
            >
              Pay Now via Paystack
              <ChevronRight className="w-5 h-5" />
            </Button>
            <p className="text-center mt-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Secure 256-bit SSL Encrypted Payment
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
