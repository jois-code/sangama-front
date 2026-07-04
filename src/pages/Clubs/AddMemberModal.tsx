import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { apiClient } from '../../api/client';

interface AddMemberModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  myRole: string; // Used to restrict role assignments
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ clubId, isOpen, onClose, onSuccess, myRole }) => {
  const [srn, setSrn] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srn.trim()) {
      setError('Please enter an SRN or PRN.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/memberships/add_by_srn', {
        club_id: parseInt(clubId),
        srn: srn.trim().toUpperCase(),
        role: role
      });
      onSuccess();
      setSrn('');
      setRole('member');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border bg-background/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Member
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm bg-danger/10 text-danger border border-danger/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Student SRN or PRN</label>
            <input
              type="text"
              required
              value={srn}
              onChange={(e) => setSrn(e.target.value)}
              placeholder="e.g. PES120..."
              className="w-full bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors uppercase"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Assign Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="member">Member</option>
              {(myRole === 'head' || myRole === 'admin') && (
                <>
                  <option value="domain_head">Domain Head</option>
                  <option value="head">Club Head</option>
                </>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-text-muted hover:text-text transition-colors rounded-xl hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
