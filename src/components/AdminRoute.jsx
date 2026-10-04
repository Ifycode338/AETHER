import { useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#051510]">
    <div className="w-8 h-8 border-4 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
  </div>
);

const Denied = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#051510] px-6">
    <div className="text-center max-w-sm">
      <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
        <ShieldAlert className="w-7 h-7 text-red-400" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-white mb-2">Access Denied</h1>
      <p className="text-white/50 text-sm mb-6">You need an administrator account to view this area.</p>
      <Link to="/">
        <Button className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl">
          Back to Store
        </Button>
      </Link>
    </div>
  </div>
);

export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Denied />;
  }

  return <Outlet />;
}