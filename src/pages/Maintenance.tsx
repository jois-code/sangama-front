import React from 'react';
import { ShieldAlert } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';

const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-text relative overflow-hidden font-sans">
      {/* Dynamic Cyber Background Animation */}
      <NetworkBackground />
      
      {/* Background Glowing Hues */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[8000ms]"></div>
      </div>

      <div className="w-[90%] max-w-lg mx-auto relative z-10">
        <div className="w-full p-8 sm:p-12 bg-surface/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-red-500/10 text-center relative overflow-hidden group">
          {/* Animated Security Shield */}
          <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full border border-red-500/30 flex items-center justify-center mb-8 relative shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="absolute inset-[-8px] rounded-full border border-dashed border-red-500/40 animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute inset-[8px] rounded-full border-t-2 border-red-500/60 animate-[spin_6s_linear_infinite_reverse]"></div>
            <ShieldAlert className="w-10 h-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-red-400 tracking-widest uppercase">System Maintenance</span>
          </div>

          <h1 className="text-3xl font-extrabold bg-gradient-to-br from-white via-white to-red-400/80 bg-clip-text text-transparent mb-4 tracking-tight py-1">
            Sangama Network
          </h1>

          <p className="text-white/80 text-sm font-medium mb-6 uppercase tracking-wider">
            Offline for Security Update
          </p>

          <div className="space-y-4 text-left mb-8">
            <p className="text-text-muted text-sm leading-relaxed">
              We have detected a potential system vulnerability. In accordance with our security protocols, we have temporarily suspended all network access and API routes to guarantee the protection of your personal and academic data.
            </p>
            <p className="text-text-muted text-sm leading-relaxed">
              Our development and security teams are actively investigating and implementing necessary security patches. Access will be restored once security validation is successfully completed.
            </p>
          </div>

          {/* Footer Info (No Interactive Links) */}
          <div className="pt-8 border-t border-white/[0.08]">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Security Protocol Active
            </div>
            <div className="text-[9px] text-text-muted/40 font-mono mt-1">
              STATUS: PATCH_IN_PROGRESS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
