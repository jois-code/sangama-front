import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Loader2 } from 'lucide-react';

export const Layout = () => {
  const location = useLocation();
  const isFullWidthRoute = location.pathname.match(/^\/notes\/\d+$/);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  return (
    <div className="flex min-h-screen bg-background font-sans text-text selection:bg-primary/30">
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto min-w-0">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className={`flex-1 overflow-x-hidden min-w-0 ${isFullWidthRoute ? '' : 'p-4 lg:p-8'}`}>
          <div className={isFullWidthRoute ? 'h-full flex flex-col min-w-0' : 'max-w-7xl mx-auto min-w-0'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
