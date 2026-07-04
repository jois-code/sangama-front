import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Users, Search, Sparkles, RefreshCw } from 'lucide-react';
import { Club } from '../../api/types';

const ClubList = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchClubs = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem('my_clubs');
        if (cached) {
          const data = JSON.parse(cached);
          const approvedMemberships = data.filter((m: any) => m.status === 'approved');
          const userClubs = approvedMemberships.map((m: any) => m.club).filter(Boolean);
          setClubs(userClubs);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const response = await apiClient.get('/memberships/my');
      localStorage.setItem('my_clubs', JSON.stringify(response.data));
      // Extract club objects from memberships, only approved ones
      const approvedMemberships = response.data.filter((m: any) => m.status === 'approved');
      const userClubs = approvedMemberships.map((m: any) => m.club).filter(Boolean);
      setClubs(userClubs);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please slow down.');
      } else {
        setError('Failed to fetch clubs.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-text-muted animate-pulse">Loading amazing clubs...</div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {clubs.length === 0 && !loading && !error && (
        <div className="relative mb-12 bg-surface border border-border p-8 md:p-12 rounded-3xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-700 -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-3xl group-hover:bg-secondary/30 transition-colors duration-700 -ml-12 -mb-12"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight">
                You aren't part of any clubs yet!
              </h1>
              <p className="text-lg text-text-muted max-w-xl">
                Get involved in the campus community by joining a technical or cultural club. Expand your network and skills.
              </p>
            </div>
            <button 
              onClick={() => fetchClubs(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Clubs</span>
            </button>
          </div>
        </div>
      )}

      {clubs.length > 0 && !loading && !error && (
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight">
            My Clubs
          </h1>
          <button 
            onClick={() => fetchClubs(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-surface border border-border hover:bg-white/5 text-text px-4 py-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      )}

      {clubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <div 
              key={club.id} 
              tabIndex={0}
              onClick={() => navigate(`/clubs/${club.id}/dashboard`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/clubs/${club.id}/dashboard`);
              }}
              className="bg-surface border border-border p-6 rounded-2xl hover:border-primary hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300 group cursor-pointer flex flex-col h-full relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 bg-background border border-border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden shrink-0 shadow-inner">
                  {club.logo_url ? (
                    <img src={`https://clubs.pes.edu${club.logo_url}`} alt={club.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Users className="w-6 h-6 text-text-muted" />
                  )}
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors line-clamp-1">{club.name}</h2>
              <p className="text-sm text-text-muted line-clamp-2 mb-6 flex-grow leading-relaxed">
                {club.tagline || club.description || 'No description available.'}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                 <div className="flex items-center gap-3">
                    {club.campus && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {club.campus.replace('PESU', '').replace('Campus', '').trim()}
                      </span>
                    )}
                 </div>
                 <span className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                   View <span className="text-lg leading-none">&rarr;</span>
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubList;
