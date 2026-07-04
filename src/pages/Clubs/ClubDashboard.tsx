import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Shield, Check, X, Users, ArrowLeft, Edit, CalendarDays, FileText, Settings, LayoutGrid, RefreshCw } from 'lucide-react';
import EditClubModal from './EditClubModal';
import AddMemberModal from './AddMemberModal';
import ManageMembersModal from './ManageMembersModal';
import { useAuth } from '../../hooks/useAuth';
import { Event } from '../../api/types';

const ClubDashboard = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [myRole, setMyRole] = useState<string>('member');

  const fetchMembers = async () => {
    try {
      const memRes = await apiClient.get(`/memberships/club/${id}`);
      setMemberships(memRes.data);
    } catch (err: any) {
      console.error("Failed to load members", err);
    }
  };

  const fetchData = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    try {
      // Fetch club details
      const cachedClub = localStorage.getItem(`club_${id}`);
      if (cachedClub && !force) {
        setClub(JSON.parse(cachedClub));
      } else {
        const clubRes = await apiClient.get(`/clubs/${id}`);
        setClub(clubRes.data);
        localStorage.setItem(`club_${id}`, JSON.stringify(clubRes.data));
      }

      // Fetch my role from my memberships
      const myMemRes = await apiClient.get(`/memberships/my`);
      const myMem = myMemRes.data.find((m: any) => m.club_id === Number(id));
      if (myMem) setMyRole(myMem.role);
      else if (user?.role === 'admin' || user?.role === 'ceo') setMyRole('admin');
      
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied. You do not have permission to view this dashboard.');
      } else {
        setError('Failed to fetch club data.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (membershipId: number, status: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await apiClient.put(`/memberships/${membershipId}/status`, { status });
      fetchMembers(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleRoleChange = async (membershipId: number, newRole: string) => {
    try {
      await apiClient.put(`/memberships/${membershipId}/role`, { role: newRole });
      fetchMembers(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface border border-danger/20 p-8 rounded-3xl text-center">
        <Shield className="w-16 h-16 text-danger mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-text-muted">{error}</p>
        <button 
          onClick={() => navigate('/clubs')}
          className="mt-6 px-6 py-2 bg-surface hover:bg-white/5 border border-border rounded-xl transition-colors"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const approved = memberships.filter(m => m.status === 'approved');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/clubs')} 
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1 -ml-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>
        <button 
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-3 py-1.5 text-sm font-medium bg-surface/50 border border-white/5 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-surface/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-widest mb-3">
            <Shield className="w-4 h-4" />
            <span>SYS_ACCESS: {myRole}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 tracking-tight">
            {club?.name}
          </h1>
          <p className="text-lg text-primary font-medium mb-4">{club?.domain}</p>
          <p className="text-text-muted max-w-2xl text-sm leading-relaxed">
            {club?.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Members Matrix Card */}
        <div 
          onClick={() => {
            fetchMembers();
            setIsManageModalOpen(true);
          }}
          className="bg-surface/40 backdrop-blur-md border border-white/5 hover:border-primary/50 rounded-3xl p-6 shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[200px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-colors"></div>
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              Members Matrix
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Club Roster</h3>
            <p className="text-text-muted text-sm">Active personnel deployed</p>
          </div>
          <div className="flex items-center text-primary text-sm font-medium mt-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform duration-300">
            Manage Roster <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
          </div>
        </div>

        {/* Events Vault Card */}
        <div 
          onClick={() => {
            if (['admin', 'ceo', 'head', 'domain_head'].includes(myRole)) {
              navigate(`/clubs/${id}/events`);
            }
          }}
          className={`bg-surface/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[200px] ${['admin', 'ceo', 'head', 'domain_head'].includes(myRole) ? 'hover:border-secondary/50 cursor-pointer group hover:-translate-y-1' : ''}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[60px] group-hover:bg-secondary/20 transition-colors"></div>
          <div>
            <div className="flex items-center gap-2 text-secondary text-sm font-bold uppercase tracking-wider mb-2">
              <CalendarDays className="w-4 h-4" />
              Events Vault
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Operations</h3>
            <p className="text-text-muted text-sm">Scheduled operations</p>
          </div>
          {['admin', 'ceo', 'head', 'domain_head'].includes(myRole) && (
            <div className="flex items-center text-secondary text-sm font-medium mt-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform duration-300">
              Schedule Operation <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
            </div>
          )}
        </div>

        {/* Forms Engine Card */}
        <div 
          onClick={() => navigate(`/clubs/${id}/forms`)}
          className="bg-surface/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/50 rounded-3xl p-6 shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[200px] lg:col-span-1 md:col-span-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-colors"></div>
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" />
              Forms Engine
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Data Collection</h3>
            <p className="text-text-muted text-sm">Active data collection modules</p>
          </div>
          <div className="flex items-center text-emerald-500 text-sm font-medium mt-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform duration-300">
            Access Engine <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
          </div>
        </div>

        {/* Settings Card */}
        {['admin', 'ceo', 'head'].includes(myRole) && (
          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="bg-surface/40 backdrop-blur-md border border-white/5 hover:border-white/20 rounded-3xl p-6 shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-center items-center min-h-[100px] md:col-span-2 lg:col-span-3 text-center"
          >
            <Settings className="w-6 h-6 text-text-muted group-hover:text-white transition-colors mb-2" />
            <span className="text-sm font-medium text-text-muted group-hover:text-white transition-colors">Configure Club Parameters</span>
          </div>
        )}

      </div>

      <ManageMembersModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        memberships={memberships}
        myRole={myRole}
        handleAction={handleAction}
        handleRoleChange={handleRoleChange}
        onAddMemberClick={() => {
          setIsManageModalOpen(false); // Close manage modal
          setTimeout(() => setIsAddModalOpen(true), 300); // Open add modal after transition
        }}
      />
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          // Re-open manage modal optionally, or leave user on dashboard
          setTimeout(() => setIsManageModalOpen(true), 300);
        }}
        clubId={id!}
        myRole={myRole}
        onSuccess={() => {
          fetchData();
          fetchMembers();
        }}
      />
      <EditClubModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clubId={id!}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default ClubDashboard;
