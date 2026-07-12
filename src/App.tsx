import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Lock, ShieldCheck, Terminal, Server, Code, MessageSquare, Loader2 } from 'lucide-react';
import NetworkBackground from './components/NetworkBackground';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GlobalSyncWidget } from './components/GlobalSyncWidget';
import Maintenance from './pages/Maintenance';

const AdminClubs = React.lazy(() => import('./pages/Admin/AdminClubs'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/Admin/AdminUsers'));

const AdminYearbook = React.lazy(() => import('./pages/Admin/AdminYearbook'));
const AcademicsDashboard = React.lazy(() => import('./pages/Academics/AcademicsDashboard'));
const ClubDashboard = React.lazy(() => import('./pages/Clubs/ClubDashboard'));
const ClubList = React.lazy(() => import('./pages/Clubs/ClubList'));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon'));
const CourseDetails = React.lazy(() => import('./pages/Notes/CourseDetails'));
const Dashboard = React.lazy(() => import('./pages/Home/Dashboard'));
const Discover = React.lazy(() => import('./pages/Discover/Discover'));
const EditProfile = React.lazy(() => import('./pages/Profile/EditProfile'));
const EventDetail = React.lazy(() => import('./pages/Events/EventDetail'));
const EventList = React.lazy(() => import('./pages/Events/EventList'));
const FormBuilder = React.lazy(() => import('./pages/Forms/FormBuilder'));
const FormResponses = React.lazy(() => import('./pages/Forms/FormResponses'));
const FormViewer = React.lazy(() => import('./pages/Forms/FormViewer'));
const ManageEvents = React.lazy(() => import('./pages/Clubs/ManageEvents'));
const ManageForms = React.lazy(() => import('./pages/Clubs/ManageForms'));
const MyTeam = React.lazy(() => import('./pages/MyTeam/MyTeam'));
const NotesDashboard = React.lazy(() => import('./pages/Notes/NotesDashboard'));
const OnboardingWizard = React.lazy(() => import('./pages/Auth/OnboardingWizard'));
const PublicProfile = React.lazy(() => import('./pages/Profile/PublicProfile'));
const UserProfile = React.lazy(() => import('./pages/Profile/UserProfile'));
const YearbookList = React.lazy(() => import('./pages/Yearbook/YearbookList'));
const YearbookSubmit = React.lazy(() => import('./pages/Yearbook/YearbookSubmit'));
const BirthdayList = React.lazy(() => import('./pages/Birthdays/BirthdayList'));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
    <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
    <span className="text-sm font-medium">Loading...</span>
  </div>
);

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex items-center justify-center bg-[#0a0a0a] text-text relative overflow-hidden font-sans">
      {/* Cyber Background Animation */}
      <NetworkBackground />
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        {/* We moved the glowing blobs behind the form modal */}
      </div>

      <div className="w-[90%] max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10 py-12">

        {/* Left Column: Branding and Animation (Hidden on mobile) */}
        <div className="hidden md:flex flex-col items-center justify-center w-full md:w-1/2 max-w-lg text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent mb-6 tracking-tight drop-shadow-lg py-1">Sangama</h1>
          <p className="text-lg text-white/80 mb-16 font-medium">Access your academic data, notes & club activities.</p>

          {/* Large Animated Security Ring (Replacing Images) */}
          <div className="w-64 h-64 mx-auto bg-primary/5 rounded-full border border-primary/20 flex items-center justify-center relative shadow-[0_0_80px_rgba(139,92,246,0.2)]">
            <div className="absolute inset-[-16px] rounded-full border-2 border-dashed border-primary/40 animate-[spin_15s_linear_infinite]"></div>
            <div className="absolute inset-[12px] rounded-full border-t-4 border-primary/70 animate-[spin_5s_linear_infinite_reverse]"></div>
            <div className="absolute inset-[32px] rounded-full border-r-2 border-purple-500/50 animate-[spin_8s_linear_infinite]"></div>
            <Lock className="w-24 h-24 text-primary drop-shadow-[0_0_30px_rgba(139,92,246,0.8)]" />
          </div>
        </div>

        {/* Right Column: Login Form Container */}
        <div className="relative w-full max-w-md">
          {/* Glowing Animation behind the modal */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute -top-5 -right-5 w-64 h-64 bg-primary/30 rounded-full blur-[80px] mix-blend-screen animate-pulse duration-[4000ms]"></div>
            <div className="absolute -bottom-5 -left-5 w-64 h-64 bg-purple-600/30 rounded-full blur-[80px] mix-blend-screen animate-pulse duration-[6000ms]"></div>
          </div>

          <div className="w-full p-8 sm:p-12 bg-surface/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative z-10 overflow-hidden group">

            {/* Mobile-only Branding */}
            <div className="md:hidden text-center mb-8">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full border border-primary/30 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <div className="absolute inset-[-6px] rounded-full border border-dashed border-primary/50 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-[6px] rounded-full border-t-2 border-primary/70 animate-[spin_4s_linear_infinite_reverse]"></div>
                <Lock className="w-8 h-8 text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.8)]" />
              </div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent mb-3 tracking-tight py-1">Sangama</h1>
            </div>

            <div className="flex items-center justify-center gap-2 mb-10">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono font-semibold text-emerald-400 tracking-wider uppercase">Encrypted</span>
              </div>
            </div>

            <div className="space-y-6 mb-10 text-left">
              <div className="relative group/input">
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider pl-1 group-focus-within/input:text-primary transition-colors">University ID (SRN/PRN)</label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-white placeholder-white/30 transition-all font-mono text-sm tracking-wide shadow-inner"
                    placeholder="PES..."
                  />
                </div>
              </div>
              <div className="relative group/input">
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider pl-1 group-focus-within/input:text-primary transition-colors">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-white placeholder-white/30 transition-all font-mono text-sm tracking-widest shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-[10px] text-text-muted/60 mt-3 pl-1 font-medium flex items-start gap-1.5 leading-snug">
                  <span className="text-primary mt-0.5">*</span> Your passkey is kept only for this browser session to fetch live academic data.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!username || !password || isSubmitting}
              className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 disabled:from-primary/50 disabled:to-purple-600/50 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(139,92,246,0.4)] disabled:shadow-none"
            >
              <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Authenticate'
                )}
              </span>
            </button>


          </div>
        </div>
      </div>
    </div>
  );
};


function App() {
  return <Maintenance />;
}

export default App;
