import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Shield, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, UserPlus, X, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Club } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';

const adminCache: Record<string, any> = {};

interface User {
  id: number;
  email: string;
  srn: string;
  name: string;
  role: string;
}

const AdminClubs = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubTotal, setClubTotal] = useState(0);
  const [clubSkip, setClubSkip] = useState(0);
  
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [debouncedClubSearch, setDebouncedClubSearch] = useState('');
  
  // Assign Head state
  const [assigningClubId, setAssigningClubId] = useState<number | null>(null);
  const [headSearchQuery, setHeadSearchQuery] = useState('');
  const [headSearchUsers, setHeadSearchUsers] = useState<User[]>([]);

  // Create/Edit club state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClubId, setEditingClubId] = useState<number | null>(null);
  
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    url: '',
    logo_url: '',
    tagline: '',
    founded: '',
    campus: '',
    department: '',
    member_count: '',
    event_count: '',
    social_links: '',
    people_preview: ''
  });

  const fetchClubs = useCallback(async () => {
    if (!currentUser) return;
    const url = `/admin/clubs?skip=${clubSkip}&limit=${limit}&search=${debouncedClubSearch}`;
    if (adminCache[url]) {
      setClubs(adminCache[url].clubs);
      setClubTotal(adminCache[url].total);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get(url);
      adminCache[url] = res.data;
      setClubs(res.data.clubs);
      setClubTotal(res.data.total);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied. You do not have admin privileges.');
      } else {
        setError('Failed to fetch clubs data.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, clubSkip, debouncedClubSearch]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedClubSearch(clubSearchQuery);
      setClubSkip(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [clubSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (headSearchQuery.trim() === '') {
        setHeadSearchUsers([]);
        return;
      }
      try {
        const res = await apiClient.get(`/admin/users?skip=0&limit=5&search=${headSearchQuery}`);
        setHeadSearchUsers(res.data.users);
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [headSearchQuery]);

  const handleDeleteClub = async (clubId: number) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;
    try {
      await apiClient.delete(`/admin/clubs/${clubId}`);
      for (const key in adminCache) delete adminCache[key];
      fetchClubs();
    } catch (err) {
      alert('Failed to delete club');
    }
  };

  const openCreateModal = () => {
    setEditingClubId(null);
    setClubForm({
      name: '', description: '', url: '', logo_url: '', tagline: '',
      founded: '', campus: '', department: '', member_count: '', event_count: '', social_links: '', people_preview: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (club: Club) => {
    setEditingClubId(club.id);
    setClubForm({
      name: club.name || '',
      description: club.description || '',
      url: club.url || '',
      logo_url: club.logo_url || '',
      tagline: club.tagline || '',
      founded: club.founded || '',
      campus: club.campus || '',
      department: club.department || '',
      member_count: club.member_count || '',
      event_count: club.event_count || '',
      social_links: club.social_links || '',
      people_preview: club.people_preview || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClubId) {
        await apiClient.put(`/admin/clubs/${editingClubId}`, clubForm);
      } else {
        await apiClient.post('/admin/clubs', clubForm);
      }
      setIsModalOpen(false);
      for (const key in adminCache) delete adminCache[key];
      fetchClubs();
    } catch (err) {
      alert('Failed to save club');
    }
  };

  const handleAssignHead = async (userId: number) => {
    if (!assigningClubId) return;
    try {
      await apiClient.post(`/admin/clubs/${assigningClubId}/head?user_id=${userId}`);
      alert(`Successfully assigned as Head!`);
      setAssigningClubId(null);
      setHeadSearchQuery('');
      for (const key in adminCache) delete adminCache[key];
      fetchClubs();
    } catch (err) {
      alert('Failed to assign club head');
    }
  };

  if (loading && !clubs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-text-muted animate-pulse">Loading Clubs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldAlert className="w-16 h-16 text-danger mb-2" />
        <h1 className="text-2xl font-bold text-danger">Access Restricted</h1>
        <p className="text-text-muted">{error}</p>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 px-4 py-2 border border-border rounded-xl hover:bg-white/5 transition-colors"
        >
          Return to Admin Hub
        </button>
      </div>
    );
  }

  const isCeo = currentUser?.role === 'ceo';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 bg-surface border border-border rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-secondary" />
            Clubs Management
          </h1>
          <p className="text-text-muted mt-2">
            Create clubs, assign heads, and edit platform-wide club parameters.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-border bg-background/50 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search clubs by name..." 
                value={clubSearchQuery}
                onChange={(e) => setClubSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text placeholder:text-text-muted"
              />
            </div>
            {isCeo && (
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                <Plus className="w-4 h-4" /> Create New Club
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-grow">
          {clubs.length === 0 ? (
            <div className="text-center text-text-muted py-8">No clubs found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-text-muted text-sm border-b border-border">
                  <th className="pb-3 font-medium px-4">Club Name / Tagline</th>
                  <th className="pb-3 font-medium px-4">Department / Campus</th>
                  <th className="pb-3 font-medium text-right px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {clubs.map(club => (
                  <tr key={club.id} className="hover:bg-background/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white line-clamp-1">{club.name}</div>
                      <div className="text-xs text-text-muted line-clamp-1">{club.tagline || 'No tagline'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">{club.department || 'All Departments'}</div>
                      <div className="text-xs text-text-muted">{club.campus || 'All Campuses'}</div>
                    </td>
                    <td className="py-4 px-4 flex items-center justify-end gap-2">
                      {isCeo && (
                        <button 
                          onClick={() => setAssigningClubId(club.id)}
                          className="text-success bg-surface border border-border hover:border-success/50 p-2 rounded-lg transition-colors"
                          title="Assign Club Head"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => openEditModal(club)}
                        className="text-primary bg-surface border border-border hover:border-primary/50 p-2 rounded-lg transition-colors"
                        title="Edit Club Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {isCeo && (
                        <button 
                          onClick={() => handleDeleteClub(club.id)}
                          className="text-danger bg-surface border border-border hover:border-danger/50 p-2 rounded-lg transition-colors"
                          title="Delete Club"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-border bg-background/50">
          <span className="text-sm text-text-muted">Showing {Math.min(clubTotal, clubSkip + clubs.length)} of {clubTotal}</span>
          <div className="flex gap-2">
            <button onClick={() => setClubSkip(Math.max(0, clubSkip - limit))} disabled={clubSkip === 0} className="p-2 border border-border hover:bg-white/5 transition-colors rounded-lg disabled:opacity-50 disabled:hover:bg-transparent">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setClubSkip(clubSkip + limit)} disabled={clubSkip + limit >= clubTotal} className="p-2 border border-border hover:bg-white/5 transition-colors rounded-lg disabled:opacity-50 disabled:hover:bg-transparent">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assign Head Modal */}
      {isCeo && assigningClubId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Assign Club Head</h2>
              <button 
                onClick={() => {
                  setAssigningClubId(null);
                  setHeadSearchQuery('');
                }}
                className="text-text-muted hover:text-white transition-colors bg-white/5 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search user to assign..." 
                  value={headSearchQuery}
                  onChange={(e) => setHeadSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-text placeholder:text-text-muted"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                {headSearchQuery.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-6 bg-background/50 rounded-xl border border-border border-dashed">Start typing to search users...</div>
                ) : headSearchUsers.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-6 bg-background/50 rounded-xl border border-border border-dashed">No users found.</div>
                ) : (
                  headSearchUsers.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => handleAssignHead(u.id)}
                      className="p-4 bg-background border border-border rounded-xl hover:border-primary cursor-pointer transition-all flex items-center justify-between group hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{u.name}</div>
                        <div className="text-xs text-text-muted mt-0.5">{u.srn}</div>
                      </div>
                      <div className="bg-primary/10 text-primary p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Club Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                {editingClubId ? 'Edit Club Details' : 'Create New Club'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
              <form id="clubForm" onSubmit={handleSaveClub} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Club Name *</label>
                  <input 
                    type="text" 
                    value={clubForm.name}
                    onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    required
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Tagline</label>
                  <input 
                    type="text" 
                    value={clubForm.tagline}
                    onChange={(e) => setClubForm({...clubForm, tagline: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Description</label>
                  <textarea 
                    value={clubForm.description}
                    onChange={(e) => setClubForm({...clubForm, description: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all min-h-[120px] resize-y"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Campus</label>
                  <input 
                    type="text" 
                    value={clubForm.campus}
                    onChange={(e) => setClubForm({...clubForm, campus: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Department</label>
                  <input 
                    type="text" 
                    value={clubForm.department}
                    onChange={(e) => setClubForm({...clubForm, department: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Website URL</label>
                  <input 
                    type="url" 
                    value={clubForm.url}
                    onChange={(e) => setClubForm({...clubForm, url: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Logo URL</label>
                  <input 
                    type="url" 
                    value={clubForm.logo_url}
                    onChange={(e) => setClubForm({...clubForm, logo_url: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Founded Year</label>
                  <input 
                    type="text" 
                    value={clubForm.founded}
                    onChange={(e) => setClubForm({...clubForm, founded: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">Social Links (JSON string)</label>
                  <input 
                    type="text" 
                    value={clubForm.social_links}
                    onChange={(e) => setClubForm({...clubForm, social_links: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all font-mono text-xs"
                    placeholder='{"instagram": "https://..."}'
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-background/50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold border border-border text-text hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="clubForm"
                disabled={!clubForm.name.trim()}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {editingClubId ? 'Save Changes' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClubs;
