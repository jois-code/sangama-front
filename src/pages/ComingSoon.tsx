import React from 'react';
import { ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        <Construction className="w-12 h-12 text-primary" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
        Module Offline
      </h1>
      
      <p className="text-text-muted max-w-md text-lg leading-relaxed mb-8">
        This sector of the Sangama network is currently under construction. Please check back after the next system update.
      </p>
      
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
      >
        <ArrowLeft className="w-5 h-5" />
        Return to Dashboard
      </button>
    </div>
  );
};

export default ComingSoon;
