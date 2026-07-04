import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseMaterials } from '../../hooks/useCourseMaterials';
import { Course } from '../../api/types';
import { Search, ServerCrash, Library, ChevronRight, Loader2, Folder, Plus, X, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { get, set } from 'idb-keyval';

const NotesDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { courses, loading, error, refreshCourses } = useCourseMaterials();
  const { user } = useAuth();

  const isModerator = user?.role === 'moderator' || user?.role === 'ceo';
  const [addingCourse, setAddingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ course_title: '', course_code: '', semester_name: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    get('sync_queue_v1').then(q => setSyncQueue(q || []));
  }, []);

  const handleSync = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);
    try {
      await apiClient.post('/moderator/sync', { actions: syncQueue });
      await set('sync_queue_v1', []);
      setSyncQueue([]);
      
      // Clear cache so it fetches fresh real IDs from DB
      await set('courses_cache_v2', null);
      window.location.reload();
    } catch (error) {
      alert("Failed to sync with server. Your changes are still saved locally.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCourse = async () => {
    setIsSaving(true);
    try {
      const tempId = `temp_course_${Date.now()}`;
      const newCourse = {
        id: tempId as any,
        course_title: courseForm.course_title,
        course_code: courseForm.course_code,
        semester_name: courseForm.semester_name,
        units: [],
        custom_notes: []
      };
      
      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      cachedCourses.push(newCourse);
      await set(cacheKey, cachedCourses);

      // Add to sync queue
      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'CREATE_COURSE',
        tempId: tempId,
        payload: { ...courseForm }
      });
      await set(queueKey, queue);

      setAddingCourse(false);
      setCourseForm({ course_title: '', course_code: '', semester_name: '' });
      // Reload won't reset the queue visually since it's re-read on load
      window.location.reload();
    } catch (err) {
      alert('Failed to add course locally');
    } finally {
      setIsSaving(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (syncQueue.length > 0) {
      if (!window.confirm("You have unsynced changes. Refreshing will discard them. Continue?")) {
        return;
      }
      await set('sync_queue_v1', []);
      setSyncQueue([]);
    }
    setIsRefreshing(true);
    await set('courses_cache_v2', null);
    if (refreshCourses) {
      await refreshCourses();
    }
    setIsRefreshing(false);
  };

  const filteredCourses = courses.filter(c => 
    c.course_title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="max-w-[1600px] mx-auto min-h-full space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 flex items-center gap-3">
            <ServerCrash className="w-8 h-8 text-primary" />
            Data Banks
          </h1>
          <p className="text-text-muted font-mono uppercase tracking-widest text-sm">
            Select a subject matrix to access materials
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 text-text-muted ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {isModerator && syncQueue.length > 0 && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync {syncQueue.length} Changes
            </button>
          )}
          {isModerator && (
            <button 
              onClick={() => setAddingCourse(true)}
              className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          )}
          {/* Search Box */}
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search subjects by code or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      {loading && courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <span className="font-mono uppercase tracking-widest text-sm">Syncing local cache...</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
          <h3 className="font-bold text-lg mb-2">Connection Error</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg font-mono text-xs uppercase transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-surface/50 border border-white/5 rounded-3xl">
          <Folder className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
          <p className="text-text-muted">No subjects match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course: Course) => (
            <div 
              key={course.id}
              onClick={() => navigate(`/notes/${course.id}`)}
              className="group relative bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
            >
              {/* Decorative gradient blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 bg-white/5 rounded-xl text-primary border border-white/5 group-hover:scale-110 transition-transform">
                  <Library className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                    {course.course_code}
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 text-text-muted px-2 py-0.5 rounded-md">
                    {course.semester_name}
                  </span>
                </div>
              </div>

              <div className="flex-1 relative z-10">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.course_title}
                </h2>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                <div className="text-sm font-mono text-text-muted">
                  <span className="text-white font-bold">{course.units.length}</span> Units
                </div>
                <div className="flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  Access <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Add Course Modal */}
      {addingCourse && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setAddingCourse(false)}></div>
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Add New Course</h3>
              <button onClick={() => setAddingCourse(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  value={courseForm.course_title}
                  onChange={(e) => setCourseForm({ ...courseForm, course_title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. Data Structures and Applications"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Course Code</label>
                <input
                  type="text"
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. UE23CS241"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Semester Name</label>
                <input
                  type="text"
                  value={courseForm.semester_name}
                  onChange={(e) => setCourseForm({ ...courseForm, semester_name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. Sem-3"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setAddingCourse(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleAddCourse} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add Course</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotesDashboard;
