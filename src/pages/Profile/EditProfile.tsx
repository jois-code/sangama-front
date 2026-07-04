import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { Check, Loader2, Save, Camera, Phone, Mail } from 'lucide-react';

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

export default function EditProfile() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    photo: '',
    email: '',
    phone_number: '',
    bio: '',
    role_preference: '',
    domains: [] as string[],
    skills: [] as string[],
    availability: '',
    work_style: [] as string[],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    is_looking_for_team: true,
    is_photo_public: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        setFormData({
          photo: data.photo || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          bio: data.bio || '',
          role_preference: data.role_preference || '',
          domains: data.domains ? data.domains.split(',').map((s: string) => s.trim()) : [],
          skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()) : [],
          availability: data.availability || '',
          work_style: data.work_style ? data.work_style.split(',').map((s: string) => s.trim()) : [],
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          portfolio_url: data.portfolio_url || '',
          is_looking_for_team: data.is_looking_for_team !== false,
          is_photo_public: data.is_photo_public !== false,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const toggleSelection = (field: 'domains' | 'skills' | 'work_style', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      };

      const res = await apiClient.put('/profile/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(res.data);
      navigate('/profile');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response?.status === 400 && error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Edit Profile</h1>
          <p className="text-text-muted mt-2">Update your skills, role, and social links.</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="px-4 py-2 bg-surface border border-border rounded-xl text-text hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Basic Info & Photo Section */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Basic Info</h2>
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative w-32 h-32 rounded-full border-2 border-border overflow-hidden group cursor-pointer bg-background"
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
              <span className="text-xs text-text-muted">Click to upload photo (Max 100KB)</span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-text-muted">Or paste an image URL</label>
                <input 
                  type="url" 
                  value={formData.photo.startsWith('data:image') ? '' : formData.photo}
                  onChange={(e) => setFormData(prev => ({...prev, photo: e.target.value}))}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-text-muted flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-text-muted flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone Number (Indian Numbers Only)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={e => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white transition-all"
                    placeholder="98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-text-muted">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={e => setFormData(prev => ({...prev, bio: e.target.value}))}
                  placeholder="A short description about yourself..."
                  className="w-full h-24 bg-black/40 border border-border rounded-xl p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Availability Toggles */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Privacy & Availability</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div>
                <h3 className="font-bold text-text">Looking for Team</h3>
                <p className="text-sm text-text-muted mt-1">If enabled, you will appear in the Discover feed for others to ping. Automatically turns off when you accept a ping.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_looking_for_team: !prev.is_looking_for_team }))}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_looking_for_team ? 'bg-primary' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_looking_for_team ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div>
                <h3 className="font-bold text-text">Public Profile Photo</h3>
                <p className="text-sm text-text-muted mt-1">If disabled, your profile photo will be hidden and replaced with a default initial across the platform.</p>
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

        {/* Role & Domains */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Role & Interests</h2>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-3">Primary Role</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setFormData(prev => ({...prev, role_preference: role}))}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${formData.role_preference === role ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-3">Domains of Interest</label>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_OPTIONS.map(domain => {
                  const isSelected = formData.domains.includes(domain);
                  return (
                    <button
                      type="button"
                      key={domain}
                      onClick={() => toggleSelection('domains', domain)}
                      className={`px-4 py-2 rounded-full text-sm transition-all border ${isSelected ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {domain}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Skills</h2>
          <div>
            <label className="block text-sm font-bold text-text-muted mb-3">Technical & Soft Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSelection('skills', skill)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all border ${isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Work Style */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Work Preferences</h2>
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-3">Time Commitment</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map(avail => (
                  <button
                    type="button"
                    key={avail}
                    onClick={() => setFormData(prev => ({...prev, availability: avail}))}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${formData.availability === avail ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    {avail}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-3">Work Style</label>
              <div className="flex flex-wrap gap-2">
                {WORK_STYLE_OPTIONS.map(style => {
                  const isSelected = formData.work_style.includes(style);
                  return (
                    <button
                      type="button"
                      key={style}
                      onClick={() => toggleSelection('work_style', style)}
                      className={`px-4 py-2 rounded-full text-sm transition-all border ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Socials */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Links</h2>
          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-bold text-text-muted mb-1.5">GitHub URL</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={e => setFormData(prev => ({...prev, github_url: e.target.value}))}
                className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-text-muted mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={e => setFormData(prev => ({...prev, linkedin_url: e.target.value}))}
                className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-text-muted mb-1.5">Portfolio/Website URL</label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={e => setFormData(prev => ({...prev, portfolio_url: e.target.value}))}
                className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-20">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
