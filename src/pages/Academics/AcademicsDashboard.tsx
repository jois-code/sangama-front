import React, { useState } from 'react';
import AttendanceView from './AttendanceView';
import TimetableView from './TimetableView';
import ResultsView from './ResultsView';

const AcademicsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'timetable' | 'results'>('attendance');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Academics</h1>
          <p className="text-text-muted mt-1">Live data securely fetched from PESU Academy.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-surface/50 p-1 rounded-xl w-fit border border-border backdrop-blur-md">
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

      <div className="mt-8 transition-all duration-500 ease-in-out">
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'results' && <ResultsView />}
      </div>
    </div>
  );
};

export default AcademicsDashboard;
