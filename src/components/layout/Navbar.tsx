import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Check, X, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [pings, setPings] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const fetchPings = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/pings/inbox');
      setPings(response.data);
    } catch (err) {
      console.error('Failed to fetch pings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPings();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusUpdate = async (pingId: number, status: string) => {
    try {
      await apiClient.put(`/pings/${pingId}/status`, { status });
      setPings(pings.map(p => p.id === pingId ? { ...p, status } : p));
    } catch (err) {
      console.error('Failed to update ping status', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all pings? This cannot be undone.")) return;
    
    try {
      setLoading(true);
      await apiClient.delete('/pings/inbox');
      setPings([]);
    } catch (err) {
      console.error('Failed to clear inbox', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingPingsCount = pings.filter(p => p.status === 'pending').length;

  return (
    <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-text-muted hover:text-text transition-colors lg:hidden rounded-lg hover:bg-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>
        {/* Breadcrumbs or Page Title could go here */}
      </div>
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 transition-colors rounded-lg ${isOpen ? 'bg-white/10 text-text' : 'text-text-muted hover:text-text hover:bg-white/5'}`}
          >
            <Bell className="w-6 h-6" />
            {pendingPingsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-background"></span>
            )}
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Inbox</h3>
                  {pings.length > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                      {pings.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {pings.length > 0 && (
                    <button 
                      onClick={handleClearAll}
                      disabled={loading}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50"
                      title="Clear All"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={fetchPings}
                    disabled={loading}
                    className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1 space-y-4">
                {pings.length === 0 && !loading ? (
                  <div className="text-center py-10 text-text-muted">
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  pings.map(ping => (
                    <div key={ping.id} className={`bg-background border border-border rounded-xl p-4 transition-all ${ping.status === 'pending' ? 'shadow-md border-primary/50' : 'opacity-70'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${ping.sender_id}`} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all">
                            {ping.sender?.photo ? (
                              <img src={ping.sender.photo.startsWith('http') || ping.sender.photo.startsWith('data:') ? ping.sender.photo : `data:image/jpeg;base64,${ping.sender.photo}`} className="w-full h-full object-cover" alt="Sender" />
                            ) : (
                              <span className="font-bold text-lg text-primary">{ping.sender?.name ? ping.sender.name.charAt(0) : 'U'}</span>
                            )}
                          </Link>
                          <div>
                            <Link to={`/profile/${ping.sender_id}`} className="font-bold text-sm mb-0.5 text-text hover:text-primary transition-colors line-clamp-1">
                              {ping.sender?.name || `User #${ping.sender_id}`}
                            </Link>
                            <div className="text-[10px] text-text-muted mb-1">{ping.sender?.role_preference || 'Student'}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              ping.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                              ping.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {ping.status}
                            </span>
                          </div>
                        </div>
                        
                        {ping.status === 'pending' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleStatusUpdate(ping.id, 'accepted')}
                              className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(ping.id, 'declined')}
                              className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Decline"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-text-muted bg-surface/50 rounded-lg p-3 line-clamp-3">
                        {ping.message}
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-[10px] text-text-muted/50">
                          {new Date(ping.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
