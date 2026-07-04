import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Shield, ArrowLeft, CalendarDays, CalendarPlus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AddEventModal from './AddEventModal';
import { Event } from '../../api/types';

const ManageEvents = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [myRole, setMyRole] = useState<string>('member');
  
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const fetchData = async () => {
    try {
      // Fetch club details
      const clubRes = await apiClient.get(`/clubs/${id}`);
      setClub(clubRes.data);

      // Fetch my role from my memberships
      const myMemRes = await apiClient.get(`/memberships/my`);
      const myMem = myMemRes.data.find((m: any) => m.club_id === Number(id));
      if (myMem) setMyRole(myMem.role);
      else if (user?.role === 'admin' || user?.role === 'ceo') setMyRole('admin');

      // Fetch events
      const eventsRes = await apiClient.get(`/events/club/${id}`);
      setEvents(eventsRes.data);
      
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied. You do not have permission to view events.');
      } else {
        setError('Failed to fetch events data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async (eventId: number) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await apiClient.delete(`/events/${eventId}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !['admin', 'ceo', 'head', 'domain_head'].includes(myRole)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-danger/10 text-danger p-6 rounded-2xl max-w-md text-center border border-danger/20">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-sm opacity-80">{error || 'You do not have permission to manage events for this club.'}</p>
          <button 
            onClick={() => navigate(`/clubs/${id}/dashboard`)}
            className="mt-6 px-4 py-2 bg-danger/20 hover:bg-danger/30 rounded-xl transition-colors font-medium text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-16 animate-in fade-in duration-500">
      {/* Header section */}
      <button 
        onClick={() => navigate(`/clubs/${id}/dashboard`)}
        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6 text-sm font-medium w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-secondary text-sm font-bold uppercase tracking-wider mb-2">
            <CalendarDays className="w-4 h-4" />
            Events Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            {club?.name} Operations
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl">
            Create, manage, and schedule upcoming events for the club.
          </p>
        </div>
        <button
          onClick={() => {
            setEventToEdit(null);
            setIsAddEventModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] whitespace-nowrap transform active:scale-95"
        >
          <CalendarPlus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Operations Scheduled</h3>
            <p className="text-text-muted max-w-md mx-auto mb-8">
              Start engaging your club members by creating your first event.
            </p>
            <button
              onClick={() => {
                setEventToEdit(null);
                setIsAddEventModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event.id}
                className="bg-background/50 border border-white/5 rounded-2xl p-6 hover:border-secondary/50 transition-all duration-300 group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {new Date(event.date_time).toLocaleString()}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
                
                {event.location && (
                  <p className="text-sm text-text-muted mb-4 font-mono">📍 {event.location}</p>
                )}
                
                <div className="mt-auto pt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setEventToEdit(event);
                      setIsAddEventModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl transition-colors text-sm font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id!)}
                    className="flex items-center justify-center p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        clubId={id!}
        onSuccess={fetchData}
        editEvent={eventToEdit}
      />
    </div>
  );
};

export default ManageEvents;
