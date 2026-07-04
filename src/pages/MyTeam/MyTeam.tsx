import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Users, Mail, Code, ExternalLink, Briefcase, Zap, Loader2, Globe, Phone, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTeam = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await apiClient.get('/pings/connections');
        setConnections(response.data);
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  const handleRemoveConnection = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from your team? This will hide their contact info and remove them from your team dashboard.`)) {
      return;
    }
    try {
      await apiClient.delete(`/pings/connections/${userId}`);
      setConnections(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to remove connection:', error);
      alert('Failed to remove teammate. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
        <p>Loading your team...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface border border-border p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/30">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              My Team
            </h1>
          </div>
          <p className="text-text-muted max-w-2xl text-lg mt-2">
            These are your accepted connections. You can now view their private contact information and collaborate together!
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-xl">
          <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
            <Zap className="w-10 h-10 text-primary opacity-50" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No Teammates Yet</h3>
          <p className="text-text-muted max-w-md mx-auto mb-8">
            You haven't accepted any pings yet, or no one has accepted yours. Start connecting on the Discover page!
          </p>
          <Link to="/discover" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Go to Discover <Zap className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((user) => (
            <div key={user.id} className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all group shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col h-full relative">
              {/* Remove Connection Button */}
              <button 
                onClick={() => handleRemoveConnection(user.id, user.name)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                title="Remove from Team"
              >
                <UserMinus className="w-4 h-4" />
              </button>

              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-6 pr-8">
                <Link to={`/profile/${user.id}`} className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:ring-2 ring-primary/50 transition-all">
                  {user.photo ? (
                    <img 
                      src={user.photo.startsWith('http') || user.photo.startsWith('data:') ? user.photo : `data:image/jpeg;base64,${user.photo}`} 
                      className="w-full h-full object-cover" 
                      alt={user.name} 
                    />
                  ) : (
                    <span className="font-bold text-2xl text-primary">{user.name.charAt(0)}</span>
                  )}
                </Link>
                <div>
                  <Link to={`/profile/${user.id}`}>
                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-1">{user.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1.5 text-text-muted text-sm mt-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{user.role_preference || 'Student'}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="flex-1 space-y-4">
                {user.bio && (
                  <p className="text-sm text-text-muted line-clamp-2 bg-background/50 p-3 rounded-xl border border-border/50">
                    "{user.bio}"
                  </p>
                )}
                
                {user.skills && (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.split(',').slice(0, 3).map((skill: string, idx: number) => (
                      <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {skill.trim()}
                      </span>
                    ))}
                    {user.skills.split(',').length > 3 && (
                      <span className="bg-background border border-border text-text-muted px-2.5 py-1 rounded-lg text-xs font-semibold">
                        +{user.skills.split(',').length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Info (Revealed!) */}
              <div className="mt-6 pt-5 border-t border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Contact Info Revealed
                </h4>
                
                <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors group/link">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Email</div>
                    <div className="text-sm text-text truncate group-hover/link:text-primary transition-colors">{user.email}</div>
                  </div>
                </a>

                {user.phone_number && (
                  <a href={`tel:${user.phone_number}`} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors group/link">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Phone</div>
                      <div className="text-sm text-text truncate group-hover/link:text-primary transition-colors">{user.phone_number}</div>
                    </div>
                  </a>
                )}

                {user.github_url && (
                  <a href={user.github_url.startsWith('http') ? user.github_url : `https://${user.github_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-text/50 transition-colors group/link">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text group-hover/link:bg-white group-hover/link:text-black transition-colors">
                      <Code className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text truncate group-hover/link:underline">{user.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
                    </div>
                  </a>
                )}

                {user.linkedin_url && (
                  <a href={user.linkedin_url.startsWith('http') ? user.linkedin_url : `https://${user.linkedin_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-blue-500/50 transition-colors group/link">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/link:bg-blue-500 group-hover/link:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text truncate group-hover/link:underline">{user.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
                    </div>
                  </a>
                )}
                
                {user.portfolio_url && (
                  <a href={user.portfolio_url.startsWith('http') ? user.portfolio_url : `https://${user.portfolio_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-emerald-500/50 transition-colors group/link">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/link:bg-emerald-500 group-hover/link:text-white transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text truncate group-hover/link:underline">Portfolio</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeam;
