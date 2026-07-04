import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Lock, ShieldCheck, Terminal, Server, Code, MessageSquare } from 'lucide-react';
import NetworkBackground from './components/NetworkBackground';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ClubList from './pages/Clubs/ClubList';
import EventList from './pages/Events/EventList';
import EventDetail from './pages/Events/EventDetail';
import NotesDashboard from './pages/Notes/NotesDashboard';
import CourseDetails from './pages/Notes/CourseDetails';
import TeamFinder from './pages/Capstone/TeamFinder';
import UserProfile from './pages/Profile/UserProfile';
import GlobalSearch from './pages/Search/GlobalSearch';
import AcademicsDashboard from './pages/Academics/AcademicsDashboard';
import Dashboard from './pages/Home/Dashboard';
import ComingSoon from './pages/ComingSoon';
import FormBuilder from './pages/Forms/FormBuilder';
import FormViewer from './pages/Forms/FormViewer';
import FormResponses from './pages/Forms/FormResponses';
import ManageForms from './pages/Clubs/ManageForms';
import ManageEvents from './pages/Clubs/ManageEvents';
import OnboardingWizard from './pages/Auth/OnboardingWizard';
import EditProfile from './pages/Profile/EditProfile';
import PublicProfile from './pages/Profile/PublicProfile';
import Discover from './pages/Discover/Discover';
import MyTeam from './pages/MyTeam/MyTeam';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-text relative overflow-hidden font-sans">
      {/* Cyber Background Animation */}
      <NetworkBackground />
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] mix-blend-screen animate-pulse duration-[4000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse duration-[6000ms]"></div>
      </div>

      <div className="w-[90%] sm:w-full max-w-md p-8 sm:p-10 bg-surface/40 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(139,92,246,0.15)] text-center relative z-10 overflow-hidden group">

        {/* Animated Security Ring */}
        <div className="w-24 h-24 mx-auto bg-primary/5 rounded-full border border-primary/20 flex items-center justify-center mb-6 relative">
          <div className="absolute inset-[-4px] rounded-full border border-dashed border-primary/40 animate-[spin_8s_linear_infinite]"></div>
          <div className="absolute inset-[4px] rounded-full border-t border-primary/60 animate-[spin_3s_linear_infinite_reverse]"></div>
          <Lock className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
        </div>

        <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent mb-2 tracking-tight">Sangama Network</h1>

        <div className="flex items-center justify-center gap-2 text-text-muted mb-8 font-mono text-[10px] uppercase tracking-widest font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400/80">Encrypted Connection</span>
        </div>

        <div className="space-y-5 mb-8 text-left">
          <div className="relative">
            <label className="block text-[10px] font-mono font-bold text-text-muted mb-1.5 uppercase tracking-widest pl-1">SRN / PRN</label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white placeholder-white/20 transition-all font-mono text-sm"
                placeholder="PES120..."
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-[10px] font-mono font-bold text-text-muted mb-1.5 uppercase tracking-widest pl-1">Passkey</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white placeholder-white/20 transition-all font-mono text-sm tracking-widest"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2 pl-1 font-sans">* We do not save your password in our database. It is stored locally ;)</p>
          </div>
        </div>

        <button
          onClick={() => login(username, password)}
          disabled={!username || !password}
          className="w-full relative overflow-hidden bg-primary/90 hover:bg-primary disabled:opacity-50 disabled:hover:bg-primary/90 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
        >
          <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm">
            Authenticate Session
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>

        {/* Developer Links */}
        <div className="mt-8 pt-6 border-t border-white/[0.05]">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Open Source Project</div>
          <p className="text-xs text-white/60 mb-5 max-w-[280px] mx-auto leading-relaxed">
            Please feel free to contribute to this project! Check out the repositories below.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono text-white/50 mb-4">
            <a href="https://github.com/jois-code/sangama-front" target="_blank" rel="noreferrer" className="flex items-center gap-2 w-full sm:w-auto justify-center hover:text-primary transition-colors border border-white/5 bg-white/[0.02] hover:bg-primary/10 px-4 py-2.5 rounded-xl hover:border-primary/30">
              <Code className="w-4 h-4" /> Frontend
            </a>
            <a href="https://github.com/jois-code/sangama-back" target="_blank" rel="noreferrer" className="flex items-center gap-2 w-full sm:w-auto justify-center hover:text-secondary transition-colors border border-white/5 bg-white/[0.02] hover:bg-secondary/10 px-4 py-2.5 rounded-xl hover:border-secondary/30">
              <Server className="w-4 h-4" /> Backend
            </a>
          </div>
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono text-white/40 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Discord: <span className="text-white/80 font-bold text-primary-300">achyuthjoism</span></span>
          </div>
        </div>

      </div>
    </div>
  );
};


import ClubDashboard from './pages/Clubs/ClubDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminClubs from './pages/Admin/AdminClubs';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="clubs" element={<ClubList />} />
              <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
              <Route path="clubs/:id/forms" element={<ManageForms />} />
              <Route path="clubs/:id/events" element={<ManageEvents />} />
              <Route path="events" element={<EventList />} />
              <Route path="events/:eventId" element={<EventDetail />} />
              <Route path="capstone/*" element={<ComingSoon />} />
              <Route path="notes" element={<NotesDashboard />} />
              <Route path="notes/:courseId" element={<CourseDetails />} />
              <Route path="search" element={<ComingSoon />} />
              <Route path="discover" element={<Discover />} />
              <Route path="my-team" element={<MyTeam />} />
              <Route path="academics/*" element={<AcademicsDashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="profile/:id" element={<PublicProfile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/clubs" element={<AdminClubs />} />
              <Route path="forms/:formId/builder" element={<FormBuilder />} />
              <Route path="forms/:formId/view" element={<FormViewer />} />
              <Route path="forms/:formId/responses" element={<FormResponses />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
