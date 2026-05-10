import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock, ShieldAlert } from 'lucide-react';

const AgentGate = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/agent/verify-password`, {
        password
      });

      if (response.data.success) {
        sessionStorage.setItem('agent_auth', 'true');
        navigate('/partner-vault/plans');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid agent password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <Card className="space-y-8 text-center p-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-navy text-yellow rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-navy">Agent Portal</h2>
          <p className="text-on-surface-variant text-sm px-4">
            Enter the shared agent password to access preferential data pricing.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input 
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-center text-lg"
          />
          {error && (
            <div className="flex items-center justify-center gap-2 text-error text-xs font-bold">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full h-14 text-lg" isLoading={isLoading}>
            Verify Access
          </Button>
        </form>

        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest opacity-50">
          Authorized Resellers Only
        </p>
      </Card>
    </div>
  );
};

export default AgentGate;
