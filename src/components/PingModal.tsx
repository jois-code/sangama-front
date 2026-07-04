import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { apiClient } from '../api/client';

interface PingModalProps {
  receiverId: number;
  receiverName: string;
  onClose: () => void;
}

const PingModal: React.FC<PingModalProps> = ({ receiverId, receiverName, onClose }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post('/pings/', {
        receiver_id: receiverId,
        message: message
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send ping. You may have reached your daily limit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🏓 Ping {receiverName}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-green-500 mb-2">Ping Sent!</h3>
              <p className="text-text-muted">They will see your message in their inbox.</p>
            </div>
          ) : (
            <form onSubmit={handlePing}>
              <p className="text-sm text-text-muted mb-4">
                Send a quick message, WhatsApp link, or project pitch. (Max 250 chars)
              </p>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={250}
                placeholder="Hi, I'm working on a fintech project and need a frontend dev. Let's chat: wa.me/..."
                className="w-full bg-background border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-primary transition-colors resize-none mb-2"
                required
              />
              <div className="text-right text-xs text-text-muted mb-6">
                {message.length}/250
              </div>
              
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              
              <button 
                type="submit" 
                disabled={loading || !message.trim()}
                className="w-full bg-primary text-background font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send Ping 🏓'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PingModal;
