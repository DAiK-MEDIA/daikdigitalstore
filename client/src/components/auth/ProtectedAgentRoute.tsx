import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedAgentRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const auth = sessionStorage.getItem('agent_auth');
    setIsAuthorized(auth === 'true');
  }, [location]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/partner-vault" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAgentRoute;
