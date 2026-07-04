import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, Zap, X, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PingModal from '../../components/PingModal';

const Discover = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pingTarget, setPingTarget] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [viewFilter, setViewFilter] = useState<'year' | 'all'>('year');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const limit = 12;

  const getCampus = (srn: string, dbCampus: string) => {
    if (srn?.toUpperCase().startsWith('PES2')) return 'EC Campus';
    if (srn?.toUpperCase().startsWith('PES1')) return 'RR Campus';
    return dbCampus || 'PESU';
  };

  const fetchRecommendations = async (pageNum = 0, filter = viewFilter, query = searchQuery) => {
    if (!query.trim() && !hasSearched) return; // Don't fetch if no query and haven't searched yet
    
    setHasSearched(true);
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const matchYearQuery = filter === 'year' ? '&match_year=true' : '';
      const searchQueryParam = query ? `&q=${encodeURIComponent(query)}` : '';
      const response = await apiClient.get(`/users/search?limit=${limit}&skip=${pageNum * limit}${matchYearQuery}${searchQueryParam}`);
      
      const { data: profile } = await apiClient.get('/profile/me');
      const fetchedUsers = response.data.users.filter((u: any) => u.id !== profile.id);
      
      if (pageNum === 0) {
        setUsers(fetchedUsers);
      } else {
        setUsers(prev => [...prev, ...fetchedUsers]);
      }
      
      setHasMore(response.data.users.length === limit);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }
    fetchRecommendations(0, viewFilter, searchQuery);
  };

  // Still fetch when viewFilter changes, but only if they already searched
  useEffect(() => {
    if (hasSearched && searchQuery.trim()) {
      fetchRecommendations(0, viewFilter, searchQuery);
    }
  }, [viewFilter]);

  // handlePass removed
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
      <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
      <p>Finding teammates for you...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Discover Teammates</h1>
        <p className="text-text-muted mb-6">Find students with the skills your project needs.</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
          <div className="flex w-full md:w-[500px] gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder='Try: skills:"React" OR campus:"EC" ...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] whitespace-nowrap"
            >
              Search
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setViewFilter('year')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${viewFilter === 'year' ? 'bg-primary text-background' : 'bg-surface border border-border text-text-muted hover:text-text'}`}
            >
              My Year
            </button>
            <button 
              onClick={() => setViewFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${viewFilter === 'all' ? 'bg-primary text-background' : 'bg-surface border border-border text-text-muted hover:text-text'}`}
            >
              All Students
            </button>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        !hasSearched ? (
          <div className="max-w-3xl mx-auto py-10">
            <div className="bg-surface border border-border rounded-2xl p-8 text-left shadow-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <Zap className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Advanced Search Syntax</h2>
              </div>
              
              <p className="text-text-muted mb-6">
                Use our powerful search to find exactly who you need for your project. You can combine multiple filters using spaces (AND) or the <code className="bg-background px-1 py-0.5 rounded text-primary">OR</code> keyword.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted">Available Filters</h3>
                  <ul className="space-y-3 font-mono text-sm">
                    <li><span className="text-primary font-bold">skills:</span>"Machine Learning"</li>
                    <li><span className="text-emerald-400 font-bold">interest:</span>"Fintech"</li>
                    <li><span className="text-secondary font-bold">campus:</span>"EC" <span className="text-text-muted font-sans text-xs">(EC or RR)</span></li>
                    <li><span className="text-blue-400 font-bold">role:</span>"Frontend"</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted">Examples</h3>
                  <div className="space-y-3">
                    <div className="bg-background border border-border p-3 rounded-xl font-mono text-xs">
                      skills:"React" OR skills:"Vue"
                      <p className="text-text-muted font-sans mt-1">Finds anyone who knows React OR Vue.</p>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-xl font-mono text-xs">
                      interest:"AI/ML" campus:"EC"
                      <p className="text-text-muted font-sans mt-1">Finds AI enthusiasts strictly on the EC campus.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-surface border border-border rounded-2xl max-w-2xl mx-auto">
            <p className="text-text-muted text-lg mb-4">No teammates found for this search!</p>
            <button onClick={() => setSearchQuery('')} className="text-primary font-medium hover:underline">
              Clear Search
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-surface border border-border rounded-2xl flex flex-col hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group shadow-lg overflow-hidden">
              <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-purple-500/20 relative">
                {user.photo ? (
                  <img src={user.photo.startsWith('http') || user.photo.startsWith('data:') ? user.photo : `data:image/jpeg;base64,${user.photo}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-text/30 group-hover:scale-110 transition-transform duration-500">{user.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold">{getCampus(user.srn, user.campus)}</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{user.name}</h2>
                  {user.endorsements_count > 0 && (
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold border border-primary/20 shrink-0">
                      {user.endorsements_count} ★
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-primary mb-3 line-clamp-1">{user.role_preference || user.program || 'Student'}</p>
                
                {user.bio && (
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{user.bio}</p>
                )}
                
                {user.skills && (
                  <div className="mb-4">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.split(',').slice(0, 3).map((skill: string) => (
                        <span key={skill} className="bg-background border border-border px-2 py-0.5 rounded-md text-[10px] font-bold text-primary uppercase tracking-wider">
                          {skill.trim()}
                        </span>
                      ))}
                      {user.skills.split(',').length > 3 && (
                        <span className="bg-background border border-border px-2 py-0.5 rounded-md text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          +{user.skills.split(',').length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {user.domains && (
                  <div className="mb-2">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Interests</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {user.domains.split(',').slice(0, 3).map((domain: string) => (
                        <span key={domain} className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {domain.trim()}
                        </span>
                      ))}
                      {user.domains.split(',').length > 3 && (
                        <span className="bg-background border border-border px-2 py-0.5 rounded-md text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          +{user.domains.split(',').length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex gap-3 pt-4 border-t border-border">
                  <Link 
                    to={`/profile/${user.id}`}
                    className="flex-1 py-2 rounded-xl font-bold text-sm border border-border text-text-muted hover:bg-background hover:text-text transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Profile
                  </Link>
                  <button 
                    onClick={() => setPingTarget(user)}
                    className="flex-1 py-2 rounded-xl font-bold text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" /> Ping
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {users.length > 0 && hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => fetchRecommendations(page + 1)}
            disabled={loadingMore}
            className="px-8 py-3 bg-surface border border-border hover:border-primary/50 text-text font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
          >
            {loadingMore ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : 'Load More Teammates'}
          </button>
        </div>
      )}

      {pingTarget && (
        <PingModal 
          receiverId={pingTarget.id} 
          receiverName={pingTarget.name} 
          onClose={() => setPingTarget(null)} 
        />
      )}
    </div>
  );
};

export default Discover;
