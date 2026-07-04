import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ArrowLeft, Calendar, MapPin, Shield, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Event } from '../../api/types';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [club, setClub] = useState<any>(null);
  const [formDetails, setFormDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventRes = await apiClient.get(`/events/${eventId}`);
        setEvent(eventRes.data);

        if (eventRes.data.club_id) {
          const clubRes = await apiClient.get(`/clubs/${eventRes.data.club_id}`);
          setClub(clubRes.data);
        }
        
        if (eventRes.data.form_id) {
          try {
            const formRes = await apiClient.get(`/forms/${eventRes.data.form_id}`);
            setFormDetails(formRes.data);
          } catch (e) {
            console.error("Failed to fetch linked form");
          }
        }
      } catch (err: any) {
        setError('Failed to fetch event details. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-danger/10 text-danger p-8 rounded-3xl border border-danger/20 inline-block">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="opacity-80">{error}</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-6 px-6 py-2.5 bg-danger/20 hover:bg-danger/30 rounded-xl transition-colors font-medium"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-9xl mx-auto  mt-8 animate-in fade-in duration-500">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 text-sm font-medium w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      {/* Hero Section */}
      <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl mb-8 relative overflow-hidden shadow-2xl flex flex-col">
        {event.banner_url && (
          <div className="w-full h-64 md:h-80 relative">
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/20 to-transparent"></div>
          </div>
        )}

        <div className={`relative z-10 p-6 md:p-8 ${event.banner_url ? '-mt-20' : ''}`}>
          {!event.banner_url && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              {new Date(event.date_time).toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 bg-white/5 text-text-muted px-3 py-1.5 rounded-lg text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {event.location || 'Location TBA'}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-4 leading-tight">
            {event.title}
          </h1>

          {club && (
            <div
              className="inline-flex items-center gap-3 mt-4 p-3 pr-6 bg-background/50 border border-white/5 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                {club.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Hosted By</p>
                <p className="text-sm font-bold text-white">{club.name}</p>
              </div>
            </div>
          )}

          {event.form_id && (
            <div className="mt-8">
              {formDetails && formDetails.closes_at && new Date() > new Date(formDetails.closes_at.endsWith('Z') ? formDetails.closes_at : formDetails.closes_at + 'Z') ? (
                <button
                  disabled
                  className="px-6 py-3 bg-surface border border-border text-text-muted rounded-xl font-bold uppercase tracking-wider cursor-not-allowed opacity-70 text-sm flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Form Closed
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/forms/${event.form_id}/view`)}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 text-sm"
                >
                  Register / Fill Form
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description Body */}
      <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-lg">
        {event.description ? (
          <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-a:text-secondary hover:prose-a:text-secondary/80 text-xs md:text-sm">
            <ReactMarkdown>{event.description}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted italic">
            No detailed description provided for this event.
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
