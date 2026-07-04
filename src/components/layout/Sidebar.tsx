import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, GraduationCap, FileText, Search, User, LogOut, BookOpen, ShieldAlert, ChevronLeft, ChevronRight, Zap, Briefcase } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/academics', icon: BookOpen, label: 'Academics' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/discover', icon: Zap, label: 'Discover' },
  { to: '/my-team', icon: Briefcase, label: 'My Team' },
  { to: '/admin', icon: ShieldAlert, label: 'Admin', adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const { logout, user } = useAuth();
  
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin' || user?.role === 'ceo';
    }
    if (item.moderatorOnly) {
      return user?.role === 'moderator' || user?.role === 'ceo';
    }
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-surface border-r border-border flex flex-col pt-6 pb-4 shadow-2xl transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-56"
      )}>
        
        {/* Toggle Collapse Button */}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-8 bg-surface border border-white/10 rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-all z-50 shadow-lg"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        <div className={cn("mb-8 transition-all duration-300", isCollapsed ? "px-2 text-center" : "px-5")}>
          <h1 className={cn("font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent tracking-tighter transition-all duration-300", isCollapsed ? "text-2xl" : "text-xl")}>
            {isCollapsed ? "S" : "Sangama"}
          </h1>
          {!isCollapsed && <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-semibold">PESU Network</p>}
        </div>

        <nav className={cn("flex-1 space-y-2 overflow-y-auto custom-scrollbar", isCollapsed ? "px-2" : "px-4")}>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (onClose) onClose(); }}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl transition-all duration-300 group overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-text-muted hover:bg-white/5 hover:text-text"
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={cn("mt-auto border-t border-border pt-4 space-y-2", isCollapsed ? "px-2" : "px-4")}>
          <NavLink
            to="/profile"
            onClick={() => { if (onClose) onClose(); }}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-xl transition-all duration-300 overflow-hidden",
                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-text"
              )
            }
            title={isCollapsed ? "Profile" : undefined}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>
          <button 
            onClick={logout}
            className={cn(
              "w-full flex items-center rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-300 text-left overflow-hidden",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
