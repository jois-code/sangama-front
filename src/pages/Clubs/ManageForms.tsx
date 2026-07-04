import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Shield, ArrowLeft, FileText, Plus, Settings, Eye, Users, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ManageForms = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [club, setClub] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [myRole, setMyRole] = useState<string>('member');
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch club details
      const clubRes = await apiClient.get(`/clubs/${id}`);
      setClub(clubRes.data);

      // Fetch my role from my memberships
      const myMemRes = await apiClient.get(`/memberships/my`);
      const myMem = myMemRes.data.find((m: any) => m.club_id === Number(id));
      if (myMem) setMyRole(myMem.role);
      else if (user?.role === 'admin' || user?.role === 'ceo') setMyRole('admin');

      // Fetch forms
      const formsRes = await apiClient.get(`/forms/club/${id}`);
      setForms(formsRes.data);
      
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied. You do not have permission to view forms.');
      } else {
        setError('Failed to fetch forms data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateForm = async () => {
    setIsCreating(true);
    try {
      const response = await apiClient.post('/forms/', {
        title: 'Untitled Form',
        club_id: parseInt(id!)
      });
      navigate(`/forms/${response.data.id}/builder`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create form');
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this form? This will destroy all fields and collected responses forever.")) return;
    try {
      await apiClient.delete(`/forms/${formId}`);
      setForms(forms.filter(f => f.id !== formId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete form');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
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
          onClick={() => navigate(`/clubs/${id}/dashboard`)}
          className="mt-6 px-6 py-2 bg-surface hover:bg-white/5 border border-border rounded-xl transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isHead = ['admin', 'ceo', 'head', 'domain_head'].includes(myRole);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(`/clubs/${id}/dashboard`)} 
        className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 py-1 -ml-2 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Hero Banner */}
      <div className="bg-surface/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase tracking-widest mb-3">
            <FileText className="w-4 h-4" />
            <span>{club?.name} / Forms Engine</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 tracking-tight">
            Manage Forms
          </h1>
          <p className="text-text-muted max-w-2xl text-sm leading-relaxed">
            Create, manage, and analyze data collection modules for your club operations.
          </p>
        </div>

        {isHead && (
          <button
            onClick={handleCreateForm}
            disabled={isCreating}
            className="relative z-10 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            )}
            Deploy New Form
          </button>
        )}
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="bg-surface/40 border border-border border-dashed rounded-3xl p-12 text-center">
          <FileText className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No forms deployed yet</h3>
          <p className="text-text-muted">Click the deploy button above to create your first form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-surface border border-white/5 hover:border-emerald-500/50 rounded-2xl p-6 shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-mono px-2 py-1 rounded-md ${form.is_published ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {form.is_published ? 'ONLINE' : 'DRAFT'}
                  </span>
                  {isHead && (
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"
                      title="Delete Form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 truncate" title={form.title}>{form.title}</h3>
                <p className="text-text-muted text-sm line-clamp-2">{form.description || 'No description provided.'}</p>
              </div>
              
              <div className="flex items-center gap-2 mt-6">
                {isHead && (
                  <>
                    <button 
                      onClick={() => navigate(`/forms/${form.id}/builder`)}
                      className="p-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-500 text-text-muted rounded-lg transition-colors border border-border hover:border-emerald-500/30 flex-1 flex justify-center items-center gap-2"
                      title="Edit Form"
                    >
                      <Settings className="w-4 h-4" /> <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/forms/${form.id}/responses`)}
                      className="p-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-500 text-text-muted rounded-lg transition-colors border border-border hover:border-emerald-500/30 flex-1 flex justify-center items-center gap-2"
                      title="View Responses"
                    >
                      <Users className="w-4 h-4" /> <span className="text-xs font-medium">Data</span>
                    </button>
                  </>
                )}
                {form.is_published && (
                  <button 
                    onClick={() => window.open(`/forms/${form.id}/view`, '_blank')}
                    className="p-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-500 text-text-muted rounded-lg transition-colors border border-border hover:border-emerald-500/30 flex-1 flex justify-center items-center gap-2"
                    title="Preview Form"
                  >
                    <Eye className="w-4 h-4" /> <span className="text-xs font-medium">View</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageForms;
