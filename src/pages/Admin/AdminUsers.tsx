/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Users, Search, ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface User {
  id: number;
  email: string;
  srn: string;
  name: string;
  role: string;
  is_active: boolean;
}

const adminCache: Record<string, { users: User[]; total: number }> = {};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSkip, setUserSkip] = useState(0);
  
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'ceo') {
      setError('Access Denied. You must be CEO to view this page.');
      setLoading(false);
      return;
    }
    const url = `/admin/users?skip=${userSkip}&limit=${limit}&search=${debouncedUserSearch}`;
    if (adminCache[url]) {
      setUsers(adminCache[url].users);
      setUserTotal(adminCache[url].total);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get(url);
      adminCache[url] = res.data;
      setUsers(res.data.users);
      setUserTotal(res.data.total);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('Access Denied. You do not have CEO privileges.');
      } else {
        setError('Failed to fetch users data.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, userSkip, debouncedUserSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUserSearch(userSearchQuery);
      setUserSkip(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [userSearchQuery]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role?role=${newRole}`);
      for (const key in adminCache) delete adminCache[key]; // clear cache
      fetchUsers();
    } catch {
      alert('Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      for (const key in adminCache) delete adminCache[key]; // clear cache
      fetchUsers();
    } catch {
      alert('Failed to delete user');
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-text-muted animate-pulse">Loading Users Directory...</div>
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
            <Users className="w-8 h-8 text-primary" />
            Users Directory
          </h1>
          <p className="text-text-muted mt-2">
            Manage all platform users, roles, and access.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-border bg-background/50 flex flex-col gap-4 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search users by name, SRN, or email..." 
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text placeholder:text-text-muted"
            />
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-grow">
          {users.length === 0 ? (
            <div className="text-center text-text-muted py-8">No users found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-text-muted text-sm border-b border-border">
                  <th className="pb-3 font-medium px-4">Name / SRN</th>
                  <th className="pb-3 font-medium px-4">Role</th>
                  <th className="pb-3 font-medium text-right px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-background/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-xs text-text-muted">{user.srn} • {user.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wider ${user.role === 'ceo' ? 'bg-danger/20 text-danger border border-danger/30' : user.role === 'admin' ? 'bg-secondary/20 text-secondary border border-secondary/30' : user.role === 'moderator' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-3">
                      {user.role !== 'ceo' && (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs bg-surface border border-border text-text px-2 py-1.5 rounded-lg transition-colors focus:outline-none focus:border-primary"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                          <option value="ceo">CEO</option>
                        </select>
                      )}
                      {user.role !== 'ceo' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs bg-surface border border-border hover:border-danger text-danger px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Delete
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
          <span className="text-sm text-text-muted">Showing {Math.min(userTotal, userSkip + users.length)} of {userTotal}</span>
          <div className="flex gap-2">
            <button onClick={() => setUserSkip(Math.max(0, userSkip - limit))} disabled={userSkip === 0} className="p-2 border border-border hover:bg-white/5 transition-colors rounded-lg disabled:opacity-50 disabled:hover:bg-transparent">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setUserSkip(userSkip + limit)} disabled={userSkip + limit >= userTotal} className="p-2 border border-border hover:bg-white/5 transition-colors rounded-lg disabled:opacity-50 disabled:hover:bg-transparent">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
