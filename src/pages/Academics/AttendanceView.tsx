import React, { useEffect, useState } from 'react';
import { pesuApi } from '../../api/pesu';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AttendanceSubject {
  code: string;
  name: string;
  percentage: number;
  attended: number;
  total: number;
}

const AttendanceView = () => {
  const [data, setData] = useState<AttendanceSubject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await pesuApi.getAttendance(forceRefresh);
      // The new pesu_api returns the raw dictionary with 'ATTENDANCE_LIST' or 'STUDENT_SUBJECTS'
      let attendanceList = [];
      if (Array.isArray(response)) {
        attendanceList = response;
      } else if (response.ATTENDANCE_LIST && Array.isArray(response.ATTENDANCE_LIST)) {
        attendanceList = response.ATTENDANCE_LIST;
      } else if (response.attendance && Array.isArray(response.attendance)) {
        attendanceList = response.attendance;
      } else if (response.STUDENT_SUBJECTS && Array.isArray(response.STUDENT_SUBJECTS)) {
        attendanceList = response.STUDENT_SUBJECTS;
      }

      // Map the properties if it uses the Vercel API structure vs the PESU mobile API structure
      const normalizedData = attendanceList.map((item: any) => ({
        code: item.code || item.subjectCode || item.SubjectCode || item.courseCode || 'N/A',
        name: item.name || item.subjectName || item.SubjectName || item.courseTitle || 'Unknown Subject',
        percentage: item.percentage ?? item.attendancePercentage ?? item.AttendancePercenrage ?? 0,
        attended: item.attended ?? item.classesAttended ?? item.AttendedClasses ?? item.classesPresent ?? 0,
        total: item.total ?? item.classesHeld ?? item.TotalClasses ?? item.totalClasses ?? 0,
      }));

      setData(normalizedData);
    } catch (err: any) {
      if (err.message === 'CREDENTIALS_MISSING') {
        setError('Your login credentials are missing. Please log out and log in again.');
      } else {
        setError('Failed to fetch attendance data from PESU.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>Fetching live data...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => fetchData(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span className="font-medium text-sm">Refresh Data</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data && data.length > 0 ? data.map((subject, idx) => (
        <div key={idx} className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-primary font-bold mb-1 tracking-wider">{subject.code}</p>
              <h3 className="font-semibold text-text line-clamp-2 leading-snug">{subject.name}</h3>
            </div>
          </div>

          <div className="flex items-end justify-between mt-6">
            <div>
              <p className="text-sm text-text-muted mb-1">Classes Attended</p>
              <p className="text-2xl font-bold text-text">
                {subject.attended} <span className="text-sm font-normal text-text-muted">/ {subject.total}</span>
              </p>
            </div>
            
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border" />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={`${28 * 2 * Math.PI}`}
                  strokeDashoffset={`${28 * 2 * Math.PI - (subject.percentage / 100) * 28 * 2 * Math.PI}`}
                  className={`transition-all duration-1000 ease-out ${
                    subject.percentage >= 85 ? 'text-green-500' : 
                    subject.percentage >= 75 ? 'text-yellow-500' : 'text-red-500'
                  }`} 
                />
              </svg>
              <span className="absolute text-sm font-bold text-text">{Math.round(subject.percentage)}%</span>
            </div>
          </div>
        </div>
      )) : (
        <div className="col-span-full bg-surface border border-border rounded-2xl p-12 text-center text-text-muted">
          <p>No active attendance data found for the current semester.</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default AttendanceView;
