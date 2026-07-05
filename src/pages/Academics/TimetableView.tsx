import React, { useEffect, useState } from 'react';
import { pesuApi, getAcademicStatus } from '../../api/pesu';
import { AlertCircle, Loader2, Clock, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TimetableEntry {
  subject: string;
  code: string;
  teacher: string;
  room: string;
  time: string;
}

const TimetableView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [specialStatus, setSpecialStatus] = useState<string | null>(null);
  const { user, pesuSyncProgress } = useAuth();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isaResponse = await pesuApi.getIsa().catch(() => null);
        const status = getAcademicStatus(isaResponse, user?.semester);
        if (status) {
          setSpecialStatus(status);
          setLoading(false);
          return;
        }

        const response = await pesuApi.getTimetable();
        setData(response);
      } catch (err: any) {
        if (err.message === 'CREDENTIALS_MISSING') {
          setError('Your login credentials are missing. Please log out and log in again.');
        } else {
          setError('Failed to fetch timetable data from PESU.');
        }
      } finally {
        setLoading(false);
      }
    };

    const isCached = localStorage.getItem('pesu_cache_timetable_{}');
    if (isCached) {
      fetchData();
    } else if (pesuSyncProgress === 0) {
      fetchData();
    }
  }, [pesuSyncProgress]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>{pesuSyncProgress > 0 ? 'Background Sync in Progress...' : 'Fetching live timetable...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 text-red-400">
        <AlertCircle className="w-6 h-6 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg mb-1">Data Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (specialStatus) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-20 flex flex-col items-center justify-center text-center">
        <Sparkles className="w-16 h-16 mb-6 opacity-50 text-purple-400" />
        <h2 className="text-2xl font-mono uppercase tracking-widest text-purple-300 mb-2">System Status</h2>
        <p className="text-xl text-text-muted">{specialStatus}</p>
      </div>
    );
  }

  // Map days to integers based on PESU API (1 = Monday, ..., 6 = Saturday)
  const dayToNum: Record<string, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };

  const rawClasses = Array.isArray(data) ? data : [];
  
  // Filter classes for the selected day and map to our UI interface
  const classesForDay: TimetableEntry[] = rawClasses
    .filter((cls: any) => cls.day === dayToNum[selectedDay])
    .map((cls: any) => ({
      subject: cls.subjectName || 'Unknown Subject',
      code: cls.subjectCode || 'N/A',
      teacher: cls.facultyName || 'TBA',
      room: cls.roomName || 'N/A',
      time: `${cls.startTime.substring(0, 5)} - ${cls.endTime.substring(0, 5)}`,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-surface border border-border text-text-muted hover:text-text hover:bg-white/5'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {classesForDay.length > 0 ? (
        <div className="space-y-4">
          {classesForDay.map((cls, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-6">
                <div className="bg-primary/10 text-primary px-4 py-3 rounded-xl flex items-center gap-2 w-36 justify-center font-medium">
                  <Clock className="w-4 h-4" />
                  {cls.time}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text mb-1">{cls.subject}</h3>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{cls.code}</span>
                    <span>•</span>
                    <span>{cls.teacher}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-muted mb-0.5">Room</p>
                <p className="text-lg font-bold text-text">{cls.room}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-muted">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No classes scheduled for {selectedDay}.</p>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
