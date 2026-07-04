import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { Search, Users, Calendar, FileText, GraduationCap, UserCircle } from 'lucide-react';
import UserCard from '../../components/common/UserCard';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const [globalRes, usersRes] = await Promise.all([
        apiClient.get(`/search/?q=${encodeURIComponent(query)}`),
        apiClient.get(`/users/search?q=${encodeURIComponent(query)}`)
      ]);
      setResults(globalRes.data);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Global Search</h1>
      
      <form onSubmit={handleSearch} className="mb-12 relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users, clubs, events, notes, or teams..."
          className="w-full bg-surface border border-border rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:border-primary transition-colors shadow-lg"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted w-6 h-6" />
        <button type="submit" className="hidden">Search</button>
      </form>

      {loading && <div className="text-center text-text-muted">Searching...</div>}

      {(results || users.length > 0) && !loading && (
        <div className="space-y-10">
          {users.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <UserCircle className="w-5 h-5 text-primary" /> Users ({users.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user: any) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}

          {results?.clubs?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Users className="w-5 h-5 text-primary" /> Clubs ({results.clubs.length})
              </h2>
              <div className="grid gap-4">
                {results.clubs.map((item: any) => (
                  <div key={item.id} className="bg-surface p-4 rounded-xl border border-border">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results?.events?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Calendar className="w-5 h-5 text-primary" /> Events ({results.events.length})
              </h2>
              <div className="grid gap-4">
                {results.events.map((item: any) => (
                  <div key={item.id} className="bg-surface p-4 rounded-xl border border-border">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results?.notes?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <FileText className="w-5 h-5 text-primary" /> Notes ({results.notes.length})
              </h2>
              <div className="grid gap-4">
                {results.notes.map((item: any) => (
                  <div key={item.id} className="bg-surface p-4 rounded-xl border border-border">
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results?.teams?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Teams ({results.teams.length})
              </h2>
              <div className="grid gap-4">
                {results.teams.map((item: any) => (
                  <div key={item.id} className="bg-surface p-4 rounded-xl border border-border">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-primary">Looking for: {item.looking_for}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!results || Object.values(results).every((arr: any) => arr.length === 0)) && users.length === 0 && (
            <div className="text-center text-text-muted py-10">No results found for "{query}".</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
