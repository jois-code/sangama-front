import React, { useState, useEffect } from 'react';
import { X, CalendarPlus, Edit } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Event } from '../../api/types';

interface AddEventModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editEvent?: Event | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ clubId, isOpen, onClose, onSuccess, editEvent }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    location: '',
    banner_url: '',
    form_id: '' as string | number
  });
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && editEvent) {
      setFormData({
        title: editEvent.title || '',
        description: editEvent.description || '',
        date_time: new Date(editEvent.date_time).toISOString().slice(0, 16), // format for datetime-local
        location: editEvent.location || '',
        banner_url: editEvent.banner_url || '',
        form_id: editEvent.form_id || ''
      });
    } else if (isOpen && !editEvent) {
      setFormData({
        title: '',
        description: '',
        date_time: '',
        location: '',
        banner_url: '',
        form_id: ''
      });
    }
  }, [isOpen, editEvent]);

  useEffect(() => {
    if (isOpen && clubId) {
      apiClient.get(`/forms/club/${clubId}`)
        .then(res => setAvailableForms(res.data))
        .catch(err => console.error("Failed to fetch forms", err));
    }
  }, [isOpen, clubId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date_time) {
      setError('Please fill in the required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateObj = new Date(formData.date_time);
      
      if (editEvent) {
        await apiClient.put(`/events/${editEvent.id}`, {
          ...formData,
          form_id: formData.form_id === '' ? null : formData.form_id,
          date_time: dateObj.toISOString()
        });
      } else {
        await apiClient.post('/events/', {
          ...formData,
          form_id: formData.form_id === '' ? null : formData.form_id,
          date_time: dateObj.toISOString(),
          club_id: parseInt(clubId)
        });
      }
      
      onSuccess();
      setFormData({
        title: '',
        description: '',
        date_time: '',
        location: '',
        banner_url: '',
        form_id: ''
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-border bg-background/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {editEvent ? <Edit className="w-5 h-5 text-secondary" /> : <CalendarPlus className="w-5 h-5 text-secondary" />}
            {editEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="add-event-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm bg-danger/10 text-danger border border-danger/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Event Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Annual Tech Symposium"
                className="w-full bg-background border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Date and Time *</label>
              <input
                type="datetime-local"
                name="date_time"
                required
                value={formData.date_time}
                onChange={handleChange}
                className="w-full bg-background border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Main Auditorium"
                className="w-full bg-background border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Banner Image URL</label>
              <input
                type="url"
                name="banner_url"
                value={formData.banner_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-background border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Link a Form (Optional)</label>
              <select
                name="form_id"
                value={formData.form_id}
                onChange={(e) => setFormData(prev => ({ ...prev, form_id: e.target.value }))}
                className="w-full bg-background border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
              >
                <option value="">None</option>
                {availableForms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-muted mb-2">Description (Supports Markdown)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                placeholder="Use **bold**, *italics*, or lists to format your event description..."
              />
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors rounded-xl hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-event-form"
            disabled={loading}
            className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : editEvent ? (
              <Edit className="w-4 h-4" />
            ) : (
              <CalendarPlus className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : editEvent ? 'Save Changes' : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
