import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Loader2 } from 'lucide-react';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const authClient = (supabase as any).auth;

    authClient.getSession().then(({ data }: any) => {
      const session = data?.session;
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = authClient.onAuthStateChange((_event: any, session: any) => {
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/staff-hq/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
