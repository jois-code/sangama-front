import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ShieldAlert, Users, LayoutDashboard, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, clubs: 0, memberships: 0 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const statsRes = await apiClient.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied. You do not have admin privileges.');
      } else {
        setError('Failed to fetch admin data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-text-muted animate-pulse">Loading Admin Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldAlert className="w-16 h-16 text-danger mb-2" />
        <h1 className="text-2xl font-bold text-danger">Access Restricted</h1>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  const isCeo = currentUser?.role === 'ceo';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            {isCeo ? 'CEO Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-text-muted mt-2">
            {isCeo ? 'Manage the entire Sangama platform (Users, Admins, Clubs).' : 'Manage Club Details.'}
          </p>
        </div>
        <div>
          <span className={`px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs ${isCeo ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
            {currentUser?.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[40px]"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-text-muted font-bold tracking-wider text-sm uppercase">Total Users</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-4xl font-black text-white relative z-10">{stats.users}</div>
        </div>
        <div className="bg-surface/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-[40px]"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-text-muted font-bold tracking-wider text-sm uppercase">Total Clubs</h3>
            <LayoutDashboard className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-4xl font-black text-white relative z-10">{stats.clubs}</div>
        </div>
        <div className="bg-surface/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-[40px]"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-text-muted font-bold tracking-wider text-sm uppercase">Memberships</h3>
            <ShieldAlert className="w-5 h-5 text-success" />
          </div>
          <div className="text-4xl font-black text-white relative z-10">{stats.memberships}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users Card (CEO ONLY) */}
        {isCeo && (
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-surface/40 backdrop-blur-md border border-white/5 hover:border-primary/50 rounded-3xl p-8 shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[240px]"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider mb-3">
                <Users className="w-5 h-5" />
                Users Matrix
              </div>
              <h3 className="text-3xl font-black text-white mb-2">User Directory</h3>
              <p className="text-text-muted">Manage platform personnel, assign roles, and revoke access privileges.</p>
            </div>
            <div className="relative z-10 flex items-center text-primary text-sm font-bold mt-8 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform duration-300 uppercase tracking-widest">
              Access Directory <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </div>
        )}

        {/* Clubs Card (Admin & CEO) */}
        <div 
          onClick={() => navigate('/admin/clubs')}
          className="bg-surface/40 backdrop-blur-md border border-white/5 hover:border-secondary/50 rounded-3xl p-8 shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[240px]"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[80px] group-hover:bg-secondary/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-secondary text-sm font-bold uppercase tracking-wider mb-3">
              <Shield className="w-5 h-5" />
              Clubs Vault
            </div>
            <h3 className="text-3xl font-black text-white mb-2">Clubs Management</h3>
            <p className="text-text-muted">Create clubs, assign club heads, edit club parameters and update platform listings.</p>
          </div>
          <div className="relative z-10 flex items-center text-secondary text-sm font-bold mt-8 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform duration-300 uppercase tracking-widest">
            Access Vault <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
