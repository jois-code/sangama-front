import React from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface UserCardProps {
  user: {
    name: string;
    role_preference?: string;
    bio?: string;
    skills?: string;
    domains?: string;
    photo?: string;
    github_url?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    branch?: string;
    semester?: string;
  };
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/50 transition-all flex flex-col h-full group relative overflow-hidden">
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px] shrink-0">
          <div className="w-full h-full bg-surface rounded-full flex items-center justify-center overflow-hidden">
            {user.photo ? (
              <img
                src={user.photo.startsWith('data:') || user.photo.startsWith('http') ? user.photo : `data:image/jpeg;base64,${user.photo}`}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            ) : (
              <span className="text-xl font-bold text-white/50">{user.name ? user.name.charAt(0) : 'U'}</span>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{user.name}</h3>
          <p className="text-primary text-sm font-medium">{user.role_preference || 'Student'}</p>
          <p className="text-text-muted text-xs mt-1">{user.branch} • {user.semester}</p>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <p className="text-sm text-text-muted mb-4 line-clamp-2">
          {user.bio || 'No bio available.'}
        </p>

        {user.skills && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {user.skills.split(',').slice(0, 3).map((skill: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] uppercase font-bold tracking-wider">
                  {skill.trim()}
                </span>
              ))}
              {user.skills.split(',').length > 3 && (
                <span className="px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded-md text-[10px] font-bold">
                  +{user.skills.split(',').length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border flex justify-end gap-2 relative z-10 mt-auto">
        {user.github_url && (
          <a href={user.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" title="GitHub">
            <LinkIcon className="w-4 h-4" />
          </a>
        )}
        {user.linkedin_url && (
          <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-blue-400" title="LinkedIn">
            <LinkIcon className="w-4 h-4" />
          </a>
        )}
        {user.portfolio_url && (
          <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-primary" title="Portfolio">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

export default UserCard;
