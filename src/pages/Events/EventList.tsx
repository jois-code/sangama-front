import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Calendar, MapPin, ArrowRight, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Event } from '../../api/types';

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/events/');
        setEvents(response.data);
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading events...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Events</h1>
      <p className="text-text-muted mb-8">Discover upcoming campus activities and workshops.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => (
          <Link 
            to={`/events/${event.id}`} 
            key={event.id} 
            className="bg-surface border border-border rounded-2xl flex flex-col hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group shadow-lg overflow-hidden"
          >
            {/* Banner Section */}
            {event.banner_url ? (
              <div className="h-48 w-full bg-surface border-b border-border overflow-hidden relative">
                <img 
                  src={event.banner_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <div className="bg-primary/90 backdrop-blur text-white px-3 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className="text-[10px] font-bold uppercase leading-none">{new Date(event.date_time).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-tight">{new Date(event.date_time).getDate()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-surface border-b border-border relative">
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <div className="bg-primary text-white px-3 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className="text-[10px] font-bold uppercase leading-none">{new Date(event.date_time).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-tight">{new Date(event.date_time).getDate()}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 flex flex-col p-6">
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{event.title}</h2>
              <div className="flex items-center gap-2 text-sm text-text-muted font-medium mb-4">
                <MapPin className="w-4 h-4" />
                <span>{event.location || 'TBA'}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
                  View Details <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                
                {event.form_id && (
                  event.form && event.form.closes_at && new Date() > new Date(event.form.closes_at.endsWith('Z') ? event.form.closes_at : event.form.closes_at + 'Z') ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-surface border border-border text-text-muted rounded-xl text-xs font-bold uppercase tracking-wider cursor-not-allowed opacity-70 z-10 flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3" /> Form Closed
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/forms/${event.form_id}/view`);
                      }}
                      className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors z-10"
                    >
                      Register
                    </button>
                  )
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventList;
