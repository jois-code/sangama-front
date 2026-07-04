import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Edit3, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { token, user: cachedUser, updateUser } = useAuth();
  const navigate = useNavigate();
  // Initialize from cache so it renders immediately
  const [user, setUser] = useState<any>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  const getCampus = (srn: string, dbCampus: string) => {
    if (srn?.toUpperCase().startsWith('PES2')) return 'EC Campus';
    if (srn?.toUpperCase().startsWith('PES1')) return 'RR Campus';
    return dbCampus || '-';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        updateUser(response.data); // Keep global cache in sync
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    if (token && !cachedUser) fetchProfile();
  }, [token, updateUser, cachedUser]);

  if (loading && !user) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  
  if (!user) return <div className="text-center mt-10">Profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <button
          onClick={() => navigate('/profile/edit')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-1 mb-4">
              <div className="w-full h-full bg-surface rounded-full flex items-center justify-center overflow-hidden">
                {user.photo ? (
                  <img
                    src={user.photo.startsWith('data:') || user.photo.startsWith('http') ? user.photo : `data:image/jpeg;base64,${user.photo}`}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white/50">{user.name ? user.name.charAt(0) : 'U'}</span>
                )}
              </div>
            </div>
            
            {/* Polish fields */}
            <div className="flex gap-4 mb-4">
              {user.endorsements_count > 0 && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                  {user.endorsements_count} Endorsements
                </div>
              )}
              {user.rating > 0 && (
                <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/20 flex items-center gap-1">
                  ★ {user.rating}/5
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <p className="text-primary font-medium mb-3">{user.role_preference || 'Student'}</p>
            <p className="text-text-muted text-sm">{user.email}</p>
            <p className="text-text-muted text-sm">{user.srn}</p>

            <div className="flex gap-3 mt-6">
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <LinkIcon className="w-5 h-5" />
                </a>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <LinkIcon className="w-5 h-5 text-blue-400" />
                </a>
              )}
              {user.portfolio_url && (
                <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </a>
              )}
            </div>
          </div>
          
          <div className="bg-surface border border-border p-6 rounded-2xl">
            <h3 className="font-bold mb-4">Academic Details</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-text-muted">Program:</span> <span className="float-right font-medium">{user.program || '-'}</span></div>
              <div><span className="text-text-muted">Branch:</span> <span className="float-right font-medium">{user.branch || '-'}</span></div>
              <div><span className="text-text-muted">Semester:</span> <span className="float-right font-medium">{user.semester || '-'}</span></div>
              <div><span className="text-text-muted">Section:</span> <span className="float-right font-medium">{user.section || '-'}</span></div>
              <div><span className="text-text-muted">Campus:</span> <span className="float-right font-medium">{getCampus(user.srn, user.campus)}</span></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-2xl">
            <h3 className="font-bold mb-4">About Me</h3>
            <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{user.bio || 'No bio provided yet.'}</p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-2xl">
            <h3 className="font-bold mb-4">Skills</h3>
            {user.skills ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.split(',').map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : <p className="text-text-muted italic">No skills listed</p>}
          </div>

          <div className="bg-surface border border-border p-6 rounded-2xl">
            <h3 className="font-bold mb-4">Domains of Interest</h3>
            {user.domains ? (
              <div className="flex flex-wrap gap-2">
                {user.domains.split(',').map((domain: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm">
                    {domain.trim()}
                  </span>
                ))}
              </div>
            ) : <p className="text-text-muted italic">No domains listed</p>}
          </div>
          
          <div className="bg-surface border border-border p-6 rounded-2xl flex flex-wrap gap-6">
             <div>
               <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Availability</h3>
               <p className="font-medium">{user.availability || 'Not specified'}</p>
             </div>
             <div>
               <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Work Style</h3>
               <p className="font-medium">{user.work_style || 'Not specified'}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
