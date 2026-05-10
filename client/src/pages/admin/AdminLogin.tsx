import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.session) {
        navigate('/staff-hq/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <Card className="space-y-8 p-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-navy text-yellow rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-navy">Admin Access</h2>
          <p className="text-on-surface-variant text-sm">
            Sign in to manage plans, orders, and platform settings.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Admin Email"
            type="email"
            placeholder="admin@datahub.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {error && <p className="text-xs font-bold text-error text-center">{error}</p>}

          <Button type="submit" className="w-full h-14" isLoading={isLoading}>
            Login to Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
