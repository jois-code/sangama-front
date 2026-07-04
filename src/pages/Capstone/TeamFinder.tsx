import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { GraduationCap } from 'lucide-react';
import { CapstoneTeam } from '../../api/types';

const TeamFinder = () => {
  const [teams, setTeams] = useState<CapstoneTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await apiClient.get('/capstone/');
        setTeams(response.data);
      } catch (err) {
        console.error('Failed to fetch teams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading teams...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Capstone Teams</h1>
      <p className="text-text-muted mb-8">Find teammates for your final year project.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-surface border border-border p-6 rounded-2xl flex flex-col hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">{team.title}</h2>
            </div>
            <p className="text-sm text-text-muted mb-4 flex-1">{team.description}</p>
            {team.looking_for && (
              <div className="bg-background rounded-lg p-3 border border-border">
                <span className="text-xs text-text-muted block mb-1">Looking for:</span>
                <span className="text-sm font-medium text-primary">{team.looking_for}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamFinder;
