import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { Check, ChevronRight, ChevronLeft, UserCircle, Briefcase, Code, Clock, Link as LinkIcon, Loader2, Camera, Phone, Mail, Shield } from 'lucide-react';
import NetworkBackground from '../../components/NetworkBackground';

const ROLE_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Fullstack Developer',
  'UI/UX Designer', 'Data Scientist', 'Product Manager', 'Mobile Developer'
];

const DOMAIN_OPTIONS = [
  'Web3', 'AI/ML', 'FinTech', 'EdTech', 'Open Source', 'Cybersecurity', 'Cloud Computing', 'Game Dev'
];

const SKILL_OPTIONS = [
  'React', 'Python', 'Node.js', 'Figma', 'PostgreSQL', 'Docker', 'TypeScript',
  'AWS', 'Go', 'Java', 'C++', 'TailwindCSS', 'Next.js', 'Leadership', 'Public Speaking', 'Agile/Scrum'
];

const WORK_STYLE_OPTIONS = [
  'Remote preference', 'On-campus preference', 'Async work', 'Weekend-heavy', 'Flexible', 'Strictly weekdays'
];

const AVAILABILITY_OPTIONS = [
  '0-5 hrs/week', '5-10 hrs/week', '10-20 hrs/week', '20+ hrs/week'
];

export default function OnboardingWizard() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    photo: user?.photo || '',
    email: user?.email || '',
    phone_number: '',
    bio: user?.bio || '',
    role_preference: '',
    domains: [] as string[],
    skills: [] as string[],
    availability: '',
    work_style: [] as string[],
    github_url: user?.github_url || '',
    linkedin_url: user?.linkedin_url || '',
    portfolio_url: '',
    is_looking_for_team: true,
    is_photo_public: true,
  });

  const toggleSelection = (field: 'domains' | 'skills' | 'work_style', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.bio.trim()) {
      alert('Please fill out your bio before continuing.');
      return;
    }
    if (step === 2 && !formData.email.trim()) {
      alert('Please provide an email address before continuing.');
      return;
    }
    if (step === 3) {
      if (!formData.role_preference) {
        alert('Please select a primary role before continuing.');
        return;
      }
      if (formData.domains.length === 0) {
        alert('Please select at least one domain of interest before continuing.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 7));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024) {
        alert('File size should be less than 100KB. Please use a smaller image or paste a URL instead.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        photo: formData.photo,
        email: formData.email,
        phone_number: formData.phone_number,
        bio: formData.bio,
        role_preference: formData.role_preference,
        domains: formData.domains.join(', '),
        skills: formData.skills.join(', '),
        availability: formData.availability,
        work_style: formData.work_style.join(', '),
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        is_looking_for_team: formData.is_looking_for_team,
        is_photo_public: formData.is_photo_public,
        onboarding_completed: true
      };

      const res = await apiClient.put('/profile/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(res.data);
      navigate('/');
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      if (error.response?.status === 400 && error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { icon: <UserCircle className="w-5 h-5" />, title: 'Basics' },
    { icon: <Mail className="w-5 h-5" />, title: 'Contact' },
    { icon: <Briefcase className="w-5 h-5" />, title: 'Role' },
    { icon: <Code className="w-5 h-5" />, title: 'Skills' },
    { icon: <Clock className="w-5 h-5" />, title: 'Work Style' },
    { icon: <Shield className="w-5 h-5" />, title: 'Privacy' },
    { icon: <LinkIcon className="w-5 h-5" />, title: 'Socials' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      <NetworkBackground />
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] mix-blend-screen animate-pulse duration-[4000ms]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] mix-blend-screen animate-pulse duration-[6000ms]"></div>
      </div>

      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center px-4 py-12 relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent mb-2">Complete Your Profile</h1>
          <p className="text-white/50 text-sm">Let others know who you are and what you're looking for.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 6) * 100}%` }}
          ></div>
          
          {steps.map((s, i) => (
            <div key={i} className={`relative z-10 flex flex-col items-center transition-all duration-300 ${step >= i + 1 ? 'text-primary' : 'text-white/30'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-[#0a0a0a] transition-colors duration-300 ${step >= i + 1 ? 'border-primary text-primary' : 'border-white/10 text-white/30'} ${step === i + 1 ? 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}>
                {step > i + 1 ? <Check className="w-6 h-6" /> : s.icon}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest mt-3 absolute -bottom-6 w-24 text-center">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl min-h-[400px] flex flex-col">
          
          {step === 1 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Who are you?</h2>
              
              <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
                <div 
                  className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/10 overflow-hidden group cursor-pointer bg-black/40 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.photo ? (
                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary bg-primary/10">
                      {user?.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <div className="text-center sm:text-left flex-1 space-y-3">
                  <div>
                    <div className="font-bold text-2xl">{user?.name}</div>
                    <div className="text-sm text-white/50">{user?.srn} • {user?.branch}</div>
                    <p className="text-xs text-primary mt-1">Click your avatar to upload a photo (Max 100KB)</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-white/60">Or paste an image URL:</label>
                    <input 
                      type="url" 
                      value={formData.photo.startsWith('data:image') ? '' : formData.photo}
                      onChange={(e) => setFormData(prev => ({...prev, photo: e.target.value}))}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-white/80">Bio <span className="text-red-500">*</span></label>
                <textarea 
                  value={formData.bio}
                  onChange={e => setFormData(prev => ({...prev, bio: e.target.value}))}
                  placeholder="A short 1-2 sentence description about yourself..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder-white/20 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">How can teammates reach you?</h2>
              
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-bold text-white/80 mb-1.5 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-white/40 mt-2">We've pre-filled this from your registration.</p>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-bold text-white/80 mb-1.5 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone Number (Indian Numbers Only)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={e => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    placeholder="98765 43210"
                  />
                  <p className="text-xs text-white/40 mt-2">Your contact info is completely private. It will only be revealed to people after you accept their ping to join a team.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">What do you want to do?</h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-3">Primary Role <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => (
                      <button
                        key={role}
                        onClick={() => setFormData(prev => ({...prev, role_preference: role}))}
                        className={`px-4 py-2 rounded-full text-sm transition-all border ${formData.role_preference === role ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/80 mb-3">Domains of Interest (Multi-select) <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAIN_OPTIONS.map(domain => {
                      const isSelected = formData.domains.includes(domain);
                      return (
                        <button
                          key={domain}
                          onClick={() => toggleSelection('domains', domain)}
                          className={`px-4 py-2 rounded-full text-sm transition-all border ${isSelected ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                        >
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">What can you do?</h2>
              
              <div>
                <label className="block text-sm font-bold text-white/80 mb-3">Skills (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => {
                    const isSelected = formData.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSelection('skills', skill)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all border ${isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">How do you work?</h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-3">Time Commitment</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map(avail => (
                      <button
                        key={avail}
                        onClick={() => setFormData(prev => ({...prev, availability: avail}))}
                        className={`px-4 py-2 rounded-full text-sm transition-all border ${formData.availability === avail ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                      >
                        {avail}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/80 mb-3">Work Style Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_STYLE_OPTIONS.map(style => {
                      const isSelected = formData.work_style.includes(style);
                      return (
                        <button
                          key={style}
                          onClick={() => toggleSelection('work_style', style)}
                          className={`px-4 py-2 rounded-full text-sm transition-all border ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Privacy & Discovery</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-bold text-white">Looking for Team</h3>
                    <p className="text-sm text-white/50 mt-1 pr-4">If enabled, you will appear in the Discover feed for others to ping. You can turn this off later.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_looking_for_team: !prev.is_looking_for_team }))}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_looking_for_team ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_looking_for_team ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-bold text-white">Public Profile Photo</h3>
                    <p className="text-sm text-white/50 mt-1 pr-4">If disabled, your profile photo will be hidden and replaced with a default initial across the platform.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_photo_public: !prev.is_photo_public }))}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_photo_public ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_photo_public ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Where can we find your work?</h2>
              
              <div className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-bold text-white/80 mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={e => setFormData(prev => ({...prev, github_url: e.target.value}))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-white/80 mb-1.5">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={e => setFormData(prev => ({...prev, linkedin_url: e.target.value}))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    placeholder="https://linkedin.com/in/yourusername"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-white/80 mb-1.5">Portfolio/Website URL</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={e => setFormData(prev => ({...prev, portfolio_url: e.target.value}))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center border-t border-white/10 pt-6">
            <button
              onClick={prevStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            
            {step < 7 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transform active:scale-95"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSubmitting ? 'Saving...' : 'Finish Onboarding'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
