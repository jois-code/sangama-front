import React, { useState, useEffect } from 'react';
import { X, Save, Building, Link, Image, FileText, Layout, MapPin } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Club } from '../../api/types';

interface EditClubModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditClubModal: React.FC<EditClubModalProps> = ({ clubId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Club>>({
    name: '',
    tagline: '',
    description: '',
    campus: '',
    department: '',
    url: '',
    logo_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Try to load from cache first
      let loaded = false;
      const cachedMy = localStorage.getItem('my_clubs');
      if (cachedMy) {
        const memberships = JSON.parse(cachedMy);
        const club = memberships.find((m: any) => m.club?.id?.toString() === clubId)?.club;
        if (club) {
          setFormData(club);
          loaded = true;
        }
      }
      
      if (!loaded) {
        const cachedAll = localStorage.getItem('all_clubs');
        if (cachedAll) {
          const club = JSON.parse(cachedAll).find((c: Club) => c.id.toString() === clubId);
          if (club) {
            setFormData(club);
          }
        }
      }
    }
  }, [isOpen, clubId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.put(`/clubs/${clubId}`, formData);
      onSuccess(); // Close and potentially refresh
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update club details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-surface border border-border w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border bg-background/50">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" />
            Edit Club Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form id="edit-club-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Club Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="E.g., Quantum Computing Club"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Tagline (Short Summary)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline || ''}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Exploring the future of computing."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Campus</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      name="campus"
                      value={formData.campus || ''}
                      onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="E.g., PESU RR Campus"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Department / Domain</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="E.g., Technical / Cultural"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Website URL</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="url"
                    name="url"
                    value={formData.url || ''}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Logo URL</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    name="logo_url"
                    value={formData.logo_url || ''}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="/media/logos/club.png"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Detailed Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={6}
                  className="w-full bg-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y custom-scrollbar"
                  placeholder="Tell us everything about what the club does..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-text-muted hover:text-text hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-club-form"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white flex items-center gap-2 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditClubModal;
