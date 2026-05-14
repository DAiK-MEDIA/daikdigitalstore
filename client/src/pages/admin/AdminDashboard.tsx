import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../../services/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Settings as SettingsIcon,
  Plus, RefreshCw, Edit3, Trash2, Megaphone, Hash, ShieldCheck,
  LogOut, MessageSquare, X, TrendingUp, Clock, CheckCircle2, PackagePlus,
  AlertTriangle, Server, CreditCard, Smartphone, Check, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string; order_ref: string; full_name: string; phone_number: string;
  amount_paid: number; order_status: string; notification_message?: string;
  data_plans?: { size_label: string }; created_at: string;
  payment_method?: string; payment_status?: string;
}
interface Plan {
  id: string; size_label: string; size_gb: number;
  client_price: number; agent_price: number; is_active: boolean;
}
interface PlanForm { size_label: string; size_gb: string; client_price: string; agent_price: string; }
interface ManualOrderForm { full_name: string; phone_number: string; plan_id: string; user_type: string; amount_paid: string; }

const emptyPlanForm: PlanForm = { size_label: '', size_gb: '', client_price: '', agent_price: '' };
const emptyOrderForm: ManualOrderForm = { full_name: '', phone_number: '', plan_id: '', user_type: 'client', amount_paid: '' };

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b border-surface-highest">
        <h3 className="text-xl font-black text-navy">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-6">
      <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7 text-error" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-navy">Are you sure?</h3>
        <p className="text-sm text-on-surface-variant">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold border border-surface-highest text-on-surface-variant hover:bg-surface-container transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl font-bold bg-error text-white hover:bg-error/90 transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'plans' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [planModal, setPlanModal] = useState<null | 'add' | Plan>(null);
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm);
  const [planLoading, setPlanLoading] = useState(false);

  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState<ManualOrderForm>(emptyOrderForm);
  const [orderLoading, setOrderLoading] = useState(false);

  // Per-order notification
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<string | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<string | null>(null);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'unpaid' | 'paid'>('all');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found in AdminDashboard');
        showToast('Session expired. Please log in again.');
        return;
      }
      
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [ordersRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders`, { headers }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`, { headers }),
      ]);
      setOrders(ordersRes.data);
      setSettings(settingsRes.data);
      const { data: p } = await supabase.from('data_plans').select('*').order('size_gb', { ascending: true });
      setPlans(p || []);
    } catch (err: any) { 
      console.error('FetchData Error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        showToast('Unauthorized. Please log in as admin.');
      }
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + Number(o.amount_paid), 0);
  const pendingCount = orders.filter(o => o.order_status === 'pending').length;
  const deliveredCount = orders.filter(o => o.order_status === 'delivered').length;

  // ─── Order Actions ───────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    try {
      const headers = await getAuthHeader();
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${id}/status`, { status }, { headers });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
    } catch { showToast('Failed to update status'); }
  };

  const approvePayment = async (id: string) => {
    try {
      const headers = await getAuthHeader();
      const { data } = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${id}/approve`, {}, { headers });
      setOrders(prev => prev.map(o => o.id === id ? data : o));
      showToast('Payment approved!');
    } catch { showToast('Failed to approve payment'); }
  };

  const declinePayment = async (id: string) => {
    try {
      const headers = await getAuthHeader();
      const { data } = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${id}/decline`, {}, { headers });
      setOrders(prev => prev.map(o => o.id === id ? data : o));
      showToast('Payment declined and order cancelled.');
    } catch { showToast('Failed to decline payment'); }
  };

  const sendNotification = async (orderId: string) => {
    if (!notifMsg.trim()) return;
    setNotifLoading(true);
    try {
      const headers = await getAuthHeader();
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${orderId}/notification`, { message: notifMsg }, { headers });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notification_message: notifMsg } : o));
      setExpandedOrder(null);
      setNotifMsg('');
      showToast('Message sent to customer!');
    } catch { showToast('Failed to send message'); }
    finally { setNotifLoading(false); }
  };

  const createManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    try {
      const headers = await getAuthHeader();
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/manual`, {
        full_name: orderForm.full_name,
        phone_number: orderForm.phone_number,
        plan_id: orderForm.plan_id,
        user_type: orderForm.user_type,
        amount_paid: parseFloat(orderForm.amount_paid),
      }, { headers });
      setOrderModal(false);
      setOrderForm(emptyOrderForm);
      fetchData();
      showToast('Manual order created!');
    } catch { showToast('Failed to create order'); }
    finally { setOrderLoading(false); }
  };

  // ─── Plan Actions ────────────────────────────────────────────────────────
  const openAddPlan = () => { setPlanForm(emptyPlanForm); setPlanModal('add'); };
  const openEditPlan = (plan: Plan) => {
    setPlanForm({ size_label: plan.size_label, size_gb: String(plan.size_gb), client_price: String(plan.client_price), agent_price: String(plan.agent_price) });
    setPlanModal(plan);
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanLoading(true);
    try {
      const headers = await getAuthHeader();
      const payload = { size_label: planForm.size_label, size_gb: parseFloat(planForm.size_gb), client_price: parseFloat(planForm.client_price), agent_price: parseFloat(planForm.agent_price), is_active: true };
      if (planModal === 'add') {
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/plans`, payload, { headers });
        if (data) setPlans(prev => [...prev, data].sort((a, b) => a.size_gb - b.size_gb));
        showToast('Plan added!');
      } else if (planModal && typeof planModal === 'object') {
        const { data } = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/plans/${planModal.id}`, payload, { headers });
        if (data) setPlans(prev => prev.map(p => p.id === data.id ? data : p).sort((a, b) => a.size_gb - b.size_gb));
        showToast('Plan updated!');
      }
      setPlanModal(null);
    } catch { showToast('Failed to save plan'); }
    finally { setPlanLoading(false); }
  };

  const deletePlan = async (id: string) => {
    setConfirmDeletePlan(id);
  };

  const confirmDeletePlanAction = async () => {
    if (!confirmDeletePlan) return;
    try {
      const headers = await getAuthHeader();
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/plans/${confirmDeletePlan}`, { headers });
      setPlans(prev => prev.filter(p => p.id !== confirmDeletePlan));
      setConfirmDeletePlan(null);
      showToast('Plan deleted.');
    } catch { showToast('Failed to delete plan'); }
  };

  const deleteOrder = async (id: string) => {
    setConfirmDeleteOrder(id);
  };

  const confirmDeleteOrderAction = async () => {
    if (!confirmDeleteOrder) return;
    try {
      const headers = await getAuthHeader();
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${confirmDeleteOrder}`, { headers });
      setOrders(prev => prev.filter(o => o.id !== confirmDeleteOrder));
      setConfirmDeleteOrder(null);
      showToast('Order deleted.');
    } catch { showToast('Failed to delete order'); }
  };

  const togglePlan = async (plan: Plan) => {
    const newActive = !plan.is_active;
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: newActive } : p));
    try {
      const headers = await getAuthHeader();
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/plans/${plan.id}`, { is_active: newActive }, { headers });
    } catch {
      // Revert on error
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: plan.is_active } : p));
      showToast('Failed to toggle plan');
    }
  };

  // ─── Settings ───────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const headers = await getAuthHeader();
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`, settings, { headers });
      showToast('Settings saved!');
      fetchData();
    } catch { showToast('Failed to save settings'); }
    finally { setSettingsSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/staff-hq/login';
  };

  // ─── Sidebar ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'plans', label: 'Manage Plans', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[80vh]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-navy text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Plan Delete Confirmation Modal */}
      {confirmDeletePlan && (
        <ConfirmModal
          message="This plan will be permanently removed. This action cannot be undone."
          onConfirm={confirmDeletePlanAction}
          onCancel={() => setConfirmDeletePlan(null)}
        />
      )}

      {/* Order Delete Confirmation Modal */}
      {confirmDeleteOrder && (
        <ConfirmModal
          message="This order will be permanently removed from the records. This action cannot be undone."
          onConfirm={confirmDeleteOrderAction}
          onCancel={() => setConfirmDeleteOrder(null)}
        />
      )}


      {/* Plan Modal */}
      {planModal !== null && (
        <Modal title={planModal === 'add' ? 'Add New Plan' : 'Edit Plan'} onClose={() => setPlanModal(null)}>
          <form onSubmit={savePlan} className="space-y-4">
            <Input label="Size Label (e.g. 1GB)" value={planForm.size_label} onChange={e => setPlanForm({ ...planForm, size_label: e.target.value })} required />
            <Input label="Size in GB" type="number" step="0.1" value={planForm.size_gb} onChange={e => setPlanForm({ ...planForm, size_gb: e.target.value })} required />
            <Input label="Client Price (GHS)" type="number" step="0.01" value={planForm.client_price} onChange={e => setPlanForm({ ...planForm, client_price: e.target.value })} required />
            <Input label="Agent Price (GHS)" type="number" step="0.01" value={planForm.agent_price} onChange={e => setPlanForm({ ...planForm, agent_price: e.target.value })} required />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setPlanModal(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={planLoading}>Save Plan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Order Modal */}
      {orderModal && (
        <Modal title="Create Manual Order" onClose={() => setOrderModal(false)}>
          <form onSubmit={createManualOrder} className="space-y-4">
            <Input label="Full Name" value={orderForm.full_name} onChange={e => setOrderForm({ ...orderForm, full_name: e.target.value })} required />
            <Input label="Phone Number" value={orderForm.phone_number} onChange={e => setOrderForm({ ...orderForm, phone_number: e.target.value.replace(/\D/g, '').substring(0, 10) })} required />
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Data Plan</label>
              <select className="w-full border border-surface-highest rounded-lg px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy" value={orderForm.plan_id} onChange={e => setOrderForm({ ...orderForm, plan_id: e.target.value })} required>
                <option value="">Select a plan...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.size_label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">User Type</label>
              <select className="w-full border border-surface-highest rounded-lg px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy" value={orderForm.user_type} onChange={e => setOrderForm({ ...orderForm, user_type: e.target.value })}>
                <option value="client">Client</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <Input label="Amount Paid (GHS)" type="number" step="0.01" value={orderForm.amount_paid} onChange={e => setOrderForm({ ...orderForm, amount_paid: e.target.value })} required />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOrderModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={orderLoading}>Create Order</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0">
        <div className="hidden md:block bg-navy text-white rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Admin Portal</p>
          <p className="font-black text-lg">DAiK</p>
        </div>
        <div className="flex md:flex-col overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={cn('whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl font-bold transition-all', activeTab === id ? 'bg-navy text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-container')}>
              <Icon className="w-4 h-4 md:w-5 md:h-5" /> {label}
            </button>
          ))}
          <button onClick={handleLogout} className="whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl font-bold text-error hover:bg-error/10 transition-all md:mt-4">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-navy capitalize">{activeTab}</h2>
          <Button variant="outline" size="sm" onClick={fetchData} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* ─── ORDERS TAB ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-navy', bg: 'bg-navy/5' },
                { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-pending', bg: 'bg-pending/5' },
                { label: 'Delivered', value: deliveredCount, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5' },
                { label: 'Revenue (GHS)', value: totalRevenue.toFixed(2), icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/5' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className={cn("p-5 flex flex-col items-center justify-center space-y-2 border-none shadow-premium hover:scale-[1.02] transition-all", bg)}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-1", bg.replace('/5', '/10'))}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <p className="text-2xl font-black text-navy">{value}</p>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</p>
                </Card>
              ))}
            </div>

            {/* Manual Order Button & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[1.5rem] border border-surface-highest/50 shadow-sm">
              <div className="flex p-1 bg-surface-container/50 rounded-xl w-full sm:w-auto">
                {['all', 'unpaid', 'paid'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterPaymentStatus(f as any)}
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                      filterPaymentStatus === f 
                        ? "bg-navy text-white shadow-md scale-[1.02]" 
                        : "text-on-surface-variant hover:text-navy hover:bg-white/50"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={() => setOrderModal(true)} className="w-full sm:w-auto rounded-xl shadow-lg hover:shadow-navy/20">
                <PackagePlus className="w-4 h-4" /> Manual Order
              </Button>
            </div>

            <div className="space-y-4">
              {orders.filter(o => {
                if (filterPaymentStatus === 'all') return true;
                return o.payment_status === filterPaymentStatus;
              }).length === 0 && !isLoading && (
                <div className="py-20 text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-surface-highest">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto opacity-50">
                    <ShoppingBag className="w-8 h-8 text-navy" />
                  </div>
                  <p className="text-on-surface-variant font-black text-xl">No {filterPaymentStatus !== 'all' ? filterPaymentStatus : ''} orders found</p>
                </div>
              )}
              {orders
                .filter(o => {
                  if (filterPaymentStatus === 'all') return true;
                  return o.payment_status === filterPaymentStatus;
                })
                .map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative"
                >
                  <Card className="p-0 overflow-hidden border-none shadow-premium hover:shadow-2xl transition-all duration-500 group/card">
                    {/* Status accent bar - more subtle and modern */}
                    <div className={cn(
                      "absolute top-0 left-0 w-1.5 h-full transition-all duration-500 z-10",
                      order.order_status === 'pending' && "bg-pending",
                      order.order_status === 'processing' && "bg-blue-500",
                      order.order_status === 'delivered' && "bg-success",
                      order.order_status === 'cancelled' && "bg-error"
                    )} />

                    <div className="p-0 flex flex-col">
                      {/* Top Header: ID, Date, Payment Status */}
                      <div className="px-6 py-4 bg-surface-container/30 border-b border-surface-highest flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => copyToClipboard(order.order_ref)}
                            className="bg-navy text-white px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-navy/90 transition-colors shadow-sm"
                          >
                            <Hash className="w-3.5 h-3.5 text-yellow" />
                            <span className="text-xs font-black tracking-wider uppercase">#{order.order_ref.slice(-6)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant/60">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Payment Method Badge */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-surface-highest shadow-sm">
                            {order.payment_method === 'paystack' ? (
                              <><CreditCard className="w-3 h-3 text-blue-500" /><span className="text-[9px] font-black uppercase text-blue-600">Paystack</span></>
                            ) : order.payment_method === 'momo' ? (
                              <><Smartphone className="w-3 h-3 text-orange-500" /><span className="text-[9px] font-black uppercase text-orange-600">Manual Payment User</span></>
                            ) : (
                              <span className="text-[9px] font-black uppercase text-on-surface-variant/40">No Method</span>
                            )}
                          </div>

                          {/* Payment Status Badge */}
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                            order.payment_status === 'paid' 
                              ? "bg-success/10 text-success border border-success/20" 
                              : order.payment_method === 'momo'
                                ? "bg-pending/10 text-pending border border-pending/20 animate-pulse"
                                : "bg-error/10 text-error border border-error/20 animate-pulse"
                          )}>
                            {order.payment_status === 'paid' ? 'Paid' : order.payment_method === 'momo' ? 'Verify Payment' : 'Unpaid'}
                          </div>
                        </div>
                      </div>

                      {/* Main Body: Info Grid */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Customer Info */}
                        <div className="lg:col-span-3 space-y-1.5 min-w-0">
                          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Customer</p>
                          <h4 className="text-lg font-black text-navy leading-tight truncate" title={order.full_name}>
                            {order.full_name}
                          </h4>
                          <p className="text-[10px] font-bold text-on-surface-variant/60 truncate opacity-0 group-hover/card:opacity-100 transition-opacity">
                            ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>

                        {/* Recipient */}
                        <div className="lg:col-span-3 space-y-1.5 min-w-0">
                          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Recipient</p>
                          <div 
                            onClick={() => copyToClipboard(order.phone_number)}
                            className="flex items-center gap-2 group/phone cursor-pointer"
                          >
                            <span className="text-lg font-black text-navy tracking-tight">{order.phone_number}</span>
                            <span className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">COPY</span>
                          </div>
                        </div>

                        {/* Product/Plan */}
                        <div className="lg:col-span-3">
                          <div className="bg-gradient-to-br from-navy to-navy/80 p-4 rounded-2xl shadow-lg relative overflow-hidden group/plan">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover/plan:scale-150 transition-transform duration-700" />
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Bundle & Amount</p>
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <span className="text-lg font-black text-white whitespace-nowrap" title={order.data_plans?.size_label}>
                                {order.data_plans?.size_label}
                              </span>
                              <span className="text-yellow font-black text-sm whitespace-nowrap">GHS {order.amount_paid}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Quick Actions */}
                        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-3 w-full">
                          <div className="w-full relative group/status">
                            <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Order Status</p>
                            <div className="relative">
                              <select
                                value={order.order_status}
                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                className={cn(
                                  "w-full appearance-none pl-5 pr-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.05em] border-2 transition-all cursor-pointer shadow-sm bg-white",
                                  order.order_status === 'pending' && "bg-pending/10 text-secondary border-pending/30 focus:border-pending hover:bg-pending/20",
                                  order.order_status === 'processing' && "bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-400 hover:bg-blue-100",
                                  order.order_status === 'delivered' && "bg-success/10 text-success border-success/30 focus:border-success hover:bg-success/20",
                                  order.order_status === 'cancelled' && "bg-error/10 text-error border-error/30 focus:border-error hover:bg-error/20"
                                )}
                              >
                                <option value="pending">PENDING</option>
                                <option value="processing">PROCESSING</option>
                                <option value="delivered">DELIVERED</option>
                                <option value="cancelled">CANCELLED</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end lg:self-center xl:self-end pt-5 lg:pt-0 shrink-0">
                            {order.payment_status !== 'paid' && order.order_status !== 'cancelled' && (
                              <>
                                <button
                                  onClick={() => approvePayment(order.id)}
                                  className="w-11 h-11 rounded-xl flex items-center justify-center bg-success text-white shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 transition-all"
                                  title="Approve Payment"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => declinePayment(order.id)}
                                  className="w-11 h-11 rounded-xl flex items-center justify-center bg-error text-white shadow-lg hover:shadow-error/30 hover:-translate-y-0.5 transition-all"
                                  title="Decline Payment"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setExpandedOrder(expandedOrder === order.id ? null : order.id); setNotifMsg(order.notification_message || ''); }}
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                                expandedOrder === order.id || order.notification_message 
                                  ? "bg-navy text-yellow shadow-lg scale-105" 
                                  : "bg-surface-container text-navy hover:bg-navy hover:text-white"
                              )}
                              title="Customer Support Message"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="w-11 h-11 rounded-xl flex items-center justify-center bg-error/5 text-error border border-error/10 hover:bg-error hover:text-white hover:border-error transition-all"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Notification Message Bar */}
                    <AnimatePresence>
                      {(expandedOrder === order.id || order.notification_message) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-yellow/5 border-t border-yellow/20 overflow-hidden"
                        >
                          {expandedOrder === order.id ? (
                            <div className="p-6 md:p-8 space-y-4">
                              <div className="flex items-center gap-2 text-navy">
                                <MessageSquare className="w-4 h-4 text-yellow" />
                                <span className="text-xs font-black uppercase tracking-widest">Direct Customer Update</span>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-grow relative">
                                  <input
                                    type="text"
                                    placeholder="Type a private message to the customer..."
                                    value={notifMsg}
                                    onChange={e => setNotifMsg(e.target.value)}
                                    className="w-full bg-white border-2 border-surface-highest focus:border-navy rounded-2xl px-5 py-3.5 text-sm font-bold transition-all shadow-inner"
                                  />
                                </div>
                                <Button isLoading={notifLoading} onClick={() => sendNotification(order.id)} className="px-8 rounded-2xl shadow-lg">
                                  Send Update
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="px-8 py-4 flex items-center justify-between bg-yellow/10">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-sm font-bold text-navy italic">"{order.notification_message}"</p>
                              </div>
                              <button 
                                onClick={() => { setExpandedOrder(order.id); setNotifMsg(order.notification_message || ''); }}
                                className="text-[10px] font-black text-navy uppercase tracking-widest hover:underline bg-white px-3 py-1.5 rounded-lg shadow-sm"
                              >
                                Edit Message
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}


        {/* ─── PLANS TAB ─── */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={openAddPlan}><Plus className="w-4 h-4" /> Add New Plan</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {plans.map((plan) => (
                <Card key={plan.id} className={cn(
                  'relative group/plan border-none transition-all duration-300',
                  plan.is_active ? 'shadow-premium hover:shadow-2xl' : 'opacity-60 grayscale-[0.5]'
                )}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-navy group-hover/plan:text-blue-600 transition-colors">{plan.size_label}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Capacity</span>
                        <span className="text-xs text-navy font-bold">{plan.size_gb} GB</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => togglePlan(plan)} 
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all', 
                          plan.is_active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-error/10 text-error hover:bg-error/20'
                        )}
                      >
                        {plan.is_active ? 'Active' : 'Paused'}
                      </button>
                      <div className="flex bg-surface-container/50 rounded-lg p-0.5">
                        <button onClick={() => openEditPlan(plan)} className="p-2 text-navy hover:bg-white rounded-md transition-all shadow-sm" title="Edit Plan"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deletePlan(plan.id)} className="p-2 text-error hover:bg-white rounded-md transition-all shadow-sm" title="Delete Plan"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-surface-highest/50">
                    <div className="space-y-1 bg-surface-container/30 p-3 rounded-xl">
                      <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Client Price</p>
                      <p className="font-black text-navy text-lg">GHS {plan.client_price}</p>
                    </div>
                    <div className="space-y-1 bg-secondary/5 p-3 rounded-xl border border-secondary/10">
                      <p className="text-[9px] font-black text-secondary/60 uppercase tracking-widest">Agent Price</p>
                      <p className="font-black text-secondary text-lg">GHS {plan.agent_price}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === 'settings' && (
          <Card className="max-w-xl space-y-8">
            <div className="space-y-6">
              {/* Broadcast Banner */}
              <div className="space-y-4">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-yellow" /> Broadcast Banner
                </h3>
                <Input label="Message" value={settings.broadcast_message || ''} onChange={(e) => setSettings({ ...settings, broadcast_message: e.target.value })} />
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={cn('w-11 h-6 rounded-full transition-colors relative', settings.broadcast_active === 'true' ? 'bg-navy' : 'bg-surface-container')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', settings.broadcast_active === 'true' ? 'left-6' : 'left-1')} />
                    <input type="checkbox" className="sr-only" checked={settings.broadcast_active === 'true'} onChange={(e) => setSettings({ ...settings, broadcast_active: e.target.checked.toString() })} />
                  </div>
                  <span className="text-sm font-bold text-on-surface-variant">Active Site-wide</span>
                </label>
              </div>

              {/* Agent Access */}
              <div className="space-y-4 pt-6 border-t border-surface-highest">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary" /> Agent Access
                </h3>
                <Input label="Agent Login Password" type="password" placeholder="Set a new password" onChange={(e) => setSettings({ ...settings, agent_password_hash: e.target.value })} />
                <p className="text-xs text-on-surface-variant">Leave blank to keep current password.</p>
              </div>

              {/* API Integrations */}
              <div className="space-y-4 pt-6 border-t border-surface-highest">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Server className="w-4 h-4 text-navy" /> API Integrations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-surface-highest bg-surface-container/30 hover:bg-surface-container transition-colors">
                    <div className={cn('w-11 h-6 shrink-0 rounded-full transition-colors relative', settings.auto_fulfill_api === 'true' ? 'bg-navy' : 'bg-surface-highest')}>
                      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', settings.auto_fulfill_api === 'true' ? 'left-6' : 'left-1')} />
                      <input type="checkbox" className="sr-only" checked={settings.auto_fulfill_api === 'true'} onChange={(e) => setSettings({ ...settings, auto_fulfill_api: e.target.checked.toString() })} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-navy block">GetUs API</span>
                      <span className="text-xs text-on-surface-variant block leading-snug">Auto-fulfill via GetUs when paid.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-surface-highest bg-surface-container/30 hover:bg-surface-container transition-colors">
                    <div className={cn('w-11 h-6 shrink-0 rounded-full transition-colors relative', settings.auto_fulfill_api_myztadata === 'true' ? 'bg-navy' : 'bg-surface-highest')}>
                      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', settings.auto_fulfill_api_myztadata === 'true' ? 'left-6' : 'left-1')} />
                      <input type="checkbox" className="sr-only" checked={settings.auto_fulfill_api_myztadata === 'true'} onChange={(e) => setSettings({ ...settings, auto_fulfill_api_myztadata: e.target.checked.toString() })} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-navy block">MyZtaData API</span>
                      <span className="text-xs text-on-surface-variant block leading-snug">Auto-fulfill via MyZtaData when paid.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* General Settings */}
              <div className="space-y-4 pt-6 border-t border-surface-highest">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Hash className="w-4 h-4 text-navy" /> General Settings
                </h3>
                <Input label="MoMo Number" value={settings.momo_number || ''} onChange={(e) => setSettings({ ...settings, momo_number: e.target.value })} />
                <Input label="WhatsApp Link" value={settings.whatsapp_link || ''} onChange={(e) => setSettings({ ...settings, whatsapp_link: e.target.value })} />
              </div>

              <Button className="w-full" onClick={saveSettings} isLoading={settingsSaving}>
                Save All Settings
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
