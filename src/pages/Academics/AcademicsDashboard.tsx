import React, { useState, useEffect } from 'react';
import AttendanceView from './AttendanceView';
import TimetableView from './TimetableView';
import ResultsView from './ResultsView';
import { pesuApi } from '../../api/pesu';

const AcademicsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'timetable' | 'results'>('attendance');
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const checkSemData = async () => {
      try {
        const cacheKey = `pesu_cache_isa_${JSON.stringify({})}`;
        let isaData;
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          isaData = JSON.parse(cachedStr);
        }
        
        if (!isaData) {
          isaData = await pesuApi.getIsa(undefined, undefined, true);
        }

        if (isaData && isaData.semesters) {
          const maxSem = Math.max(...isaData.semesters.map((s: any) => {
            const match = s.name.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          }));
          const hasEsaAnnounced = isaData.actual_sgpa && isaData.actual_sgpa !== 'N/A';
          if (maxSem >= 7 || (maxSem === 6 && hasEsaAnnounced)) {
            setShouldHide(true);
            setActiveTab('results');
          }
        }
      } catch (e) {
        console.error("Failed to determine semester logic", e);
      }
    };
    checkSemData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Academics</h1>
          <p className="text-text-muted mt-1">Live data securely fetched from PESU Academy.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-surface/50 p-1 rounded-xl w-fit border border-border backdrop-blur-md">
        {!shouldHide && (
          <>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'attendance'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'timetable'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              Timetable
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('results')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === 'results'
              ? 'bg-primary text-white shadow-lg'
              : 'text-text-muted hover:text-text hover:bg-white/5'
          }`}
        >
          Results
        </button>
      </div>

      {shouldHide && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-6 text-center font-bold text-xl mt-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          Bro what are you doing here 😭
        </div>
      )}

      <div className="mt-8 transition-all duration-500 ease-in-out">
        {!shouldHide && activeTab === 'attendance' && <AttendanceView />}
        {!shouldHide && activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'results' && <ResultsView />}
      </div>
    </div>
  );
};

export default AcademicsDashboard;
