import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseMaterials } from '../../hooks/useCourseMaterials';
import { CourseMaterial } from '../../api/types';
import InlinePdfViewer from './InlinePdfViewer';
import { ArrowLeft, FileText, CheckSquare, MessageCircle, PlayCircle, Download, FileType, Tv, AudioLines, ChevronLeft, ChevronRight, X, Edit2, Check, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { get, set } from 'idb-keyval';

// Helper to group materials
type MaterialCategory = 'AV Summary' | 'Notes' | 'Slides' | 'Assignments' | 'Q&A';

const getMaterialCategory = (material: CourseMaterial): MaterialCategory => {
  if (material.type === 'video' || material.type === 'av_summary' || material.video_url) return 'AV Summary';
  if (material.type === 'questionbank' || material.type === 'assignment') return 'Assignments';
  if (material.type === 'qa') return 'Q&A';
  if (material.type === 'slides') return 'Slides';
  return 'Notes'; // fallback
};

interface FlatMaterial extends CourseMaterial {
  className: string;
  classIndex: number;
}

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courses, loading } = useCourseMaterials();
  const { user } = useAuth();

  // Modals and Edit State
  const [editingMaterial, setEditingMaterial] = useState<FlatMaterial | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [editingCourse, setEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ course_title: '', course_code: '' });
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [unitForm, setUnitForm] = useState({ title: '' });
  
  const course = courses.find(c => String(c.id) === String(courseId));

  // Modals state
  const [selectedPdf, setSelectedPdf] = useState<{ id: number; url: string; title: string } | null>(null);

  // Layout State
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(
    () => parseInt(sessionStorage.getItem(`selectedUnitId_${courseId}`) || '0') || null
  );
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>(
    () => (sessionStorage.getItem(`selectedCategory_${courseId}`) as MaterialCategory) || 'Notes'
  );
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPdfSidebarOpen, setIsPdfSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedUnitId) sessionStorage.setItem(`selectedUnitId_${courseId}`, String(selectedUnitId));
  }, [selectedUnitId, courseId]);

  useEffect(() => {
    sessionStorage.setItem(`selectedCategory_${courseId}`, selectedCategory);
  }, [selectedCategory, courseId]);

  const isModerator = user?.role === 'moderator' || user?.role === 'ceo';

  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    get('sync_queue_v1').then(q => setSyncQueue(q || []));
  }, []);

  const handleSync = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await apiClient.post('/moderator/sync', { actions: syncQueue });
      await set('sync_queue_v1', []);
      setSyncQueue([]);
      await set('courses_cache_v2', null);

      const mappedIds = res.data.mapped_ids || {};
      if (courseId && mappedIds[courseId]) {
        navigate(`/notes/${mappedIds[courseId]}`, { replace: true });
        window.location.reload();
        return;
      }

      window.location.reload();
    } catch (error) {
      alert("Failed to sync with server. Your changes are still saved locally.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!course) return;
    setIsSaving(true);
    try {
      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      const cIndex = cachedCourses.findIndex((c: any) => c.id === course.id);
      if (cIndex !== -1) {
        cachedCourses[cIndex].course_title = courseForm.course_title;
        cachedCourses[cIndex].course_code = courseForm.course_code;
      }
      await set(cacheKey, cachedCourses);

      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'UPDATE_COURSE',
        tempId: String(course.id),
        payload: { ...courseForm }
      });
      await set(queueKey, queue);

      setEditingCourse(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to update course locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!window.confirm("Are you sure you want to completely delete this course? This cannot be undone.")) return;
    setIsSaving(true);
    
    const isTemp = String(course.id).startsWith('temp_');
    
    try {
      const cacheKey = `courses_cache_v2`;
      let cachedCourses = await get(cacheKey) || [];
      cachedCourses = cachedCourses.filter((c: any) => String(c.id) !== String(course.id));
      await set(cacheKey, cachedCourses);

      if (isTemp) {
        const queueKey = `sync_queue_v1`;
        let queue = await get(queueKey) || [];
        queue = queue.filter((q: any) => q.tempId !== String(course.id));
        await set(queueKey, queue);
      } else {
        const queueKey = `sync_queue_v1`;
        const queue = await get(queueKey) || [];
        queue.push({
          type: 'DELETE_COURSE',
          tempId: String(course.id),
          payload: {}
        });
        await set(queueKey, queue);
      }

      navigate('/notes');
    } catch (err) {
      alert('Failed to delete course locally');
    } finally {
      setIsSaving(false);
    }
  };

  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({ title: '' });

  const handleAddUnit = async () => {
    if (!course) return;
    setIsSaving(true);
    try {
      const tempId = `temp_unit_${Date.now()}`;
      const newUnit = {
        id: tempId as any,
        title: newUnitForm.title,
        course_id: course.id,
        classes: [],
        custom_notes: []
      };
      
      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      const cIndex = cachedCourses.findIndex((c: any) => c.id === course.id);
      if (cIndex !== -1) {
        cachedCourses[cIndex].units.push(newUnit);
      }
      await set(cacheKey, cachedCourses);

      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'CREATE_UNIT',
        tempId: tempId,
        payload: { courseId: course.id, title: newUnitForm.title }
      });
      await set(queueKey, queue);

      setAddingUnit(false);
      setNewUnitForm({ title: '' });
      window.location.reload();
    } catch (err) {
      alert('Failed to add unit locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!editingUnitId || !course) return;
    setIsSaving(true);
    try {
      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      const cIndex = cachedCourses.findIndex((c: any) => c.id === course.id);
      if (cIndex !== -1) {
        const uIndex = cachedCourses[cIndex].units.findIndex((u: any) => u.id === editingUnitId);
        if (uIndex !== -1) {
          cachedCourses[cIndex].units[uIndex].title = unitForm.title;
        }
      }
      await set(cacheKey, cachedCourses);

      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'UPDATE_UNIT',
        tempId: String(editingUnitId),
        payload: { title: unitForm.title }
      });
      await set(queueKey, queue);

      setEditingUnitId(null);
      window.location.reload();
    } catch (err) {
      alert('Failed to update unit locally');
    } finally {
      setIsSaving(false);
    }
  };

  const [addingMaterial, setAddingMaterial] = useState<{ category: MaterialCategory, unitId: number } | null>(null);
  const [addMatForm, setAddMatForm] = useState<any>({});

  const handleAddMaterial = async () => {
    if (!addingMaterial || !course) return;
    setIsSaving(true);
    
    const typeMap: Record<MaterialCategory, string> = {
      'AV Summary': 'video',
      'Notes': 'notes',
      'Slides': 'slides',
      'Assignments': 'assignment',
      'Q&A': 'qa',
    };
    
    try {
      const tempId = `temp_mat_${Date.now()}`;
      const payload = {
        type: typeMap[addingMaterial.category],
        name: addMatForm.name || 'New Material',
        title: addMatForm.name || 'New Material',
        download_url: addMatForm.download_url,
        provider: addMatForm.provider
      };
      
      const newMat = { ...payload, id: tempId as any };

      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      const cIndex = cachedCourses.findIndex((c: any) => c.id === course.id);
      if (cIndex !== -1) {
        const uIndex = cachedCourses[cIndex].units.findIndex((u: any) => u.id === addingMaterial.unitId);
        if (uIndex !== -1) {
          if (!cachedCourses[cIndex].units[uIndex].classes || cachedCourses[cIndex].units[uIndex].classes.length === 0) {
            cachedCourses[cIndex].units[uIndex].classes = [{ id: `temp_class_${Date.now()}` as any, title: 'General', materials: [], custom_notes: [] }];
          }
          cachedCourses[cIndex].units[uIndex].classes[0].materials.push(newMat);
        }
      }
      await set(cacheKey, cachedCourses);

      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'CREATE_MATERIAL',
        tempId: tempId,
        payload: { unitId: addingMaterial.unitId, ...payload }
      });
      await set(queueKey, queue);

      setAddingMaterial(null);
      setAddMatForm({});
      window.location.reload();
    } catch (err) {
      alert('Failed to add material locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;
    setIsSaving(true);
    try {
      const payload: any = {};
      if (editForm.title !== undefined) payload.title = editForm.title;
      if (editForm.name !== undefined) payload.name = editForm.name;
      if (editForm.download_url !== undefined) payload.download_url = editForm.download_url;
      if (editForm.video_url !== undefined) payload.video_url = editForm.video_url;
      if (editForm.provider !== undefined) payload.provider = editForm.provider;

      const cacheKey = `courses_cache_v2`;
      const cachedCourses = await get(cacheKey) || [];
      if (cachedCourses && course) {
        const cIndex = cachedCourses.findIndex((c: any) => c.id === course.id);
        if (cIndex !== -1) {
          const uIndex = cachedCourses[cIndex].units.findIndex((u: any) => u.id === selectedUnitId);
          if (uIndex !== -1) {
            for (const cClass of cachedCourses[cIndex].units[uIndex].classes) {
              const mIndex = cClass.materials.findIndex((m: any) => m.id === editingMaterial.id);
              if (mIndex !== -1) {
                Object.assign(cClass.materials[mIndex], payload);
                break;
              }
            }
          }
        }
        await set(cacheKey, cachedCourses);
      }

      const queueKey = `sync_queue_v1`;
      const queue = await get(queueKey) || [];
      queue.push({
        type: 'UPDATE_MATERIAL',
        tempId: String(editingMaterial.id),
        payload: payload
      });
      await set(queueKey, queue);

      setEditingMaterial(null);
      window.location.reload();
    } catch (err) {
      alert('Failed to update material locally');
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize selections when course loads
  useEffect(() => {
    if (course && course.units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(course.units[0].id);
    }
  }, [course, selectedUnitId]);

  if (loading) {
    return <div className="p-8 text-center text-white/60 font-sans antialiased">Loading Matrix...</div>;
  }

  if (!course) {
    return (
      <div className="p-8 text-center flex flex-col items-center font-sans antialiased">
        <h2 className="text-2xl font-bold text-white mb-4">Course Not Found</h2>
        <button onClick={() => navigate('/notes')} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Data Banks
        </button>
      </div>
    );
  }

  const selectedUnit = course.units.find(u => u.id === selectedUnitId);

  // Aggregate and flatten all materials for the selected unit
  const allUnitMaterials: FlatMaterial[] = [];
  selectedUnit?.classes.forEach((cClass, index) => {
    cClass.materials.forEach(m => {
      allUnitMaterials.push({
        ...m,
        className: cClass.title,
        classIndex: index + 1
      });
    });
  });

  // Group materials by category
  const groupedMaterials: Record<MaterialCategory, FlatMaterial[]> = {
    'AV Summary': [],
    Notes: [],
    Slides: [],
    Assignments: [],
    'Q&A': [],
  };

  allUnitMaterials.forEach(m => {
    const cat = getMaterialCategory(m);
    groupedMaterials[cat].push(m);
  });

  const categories: MaterialCategory[] = ['AV Summary', 'Notes', 'Slides', 'Assignments', 'Q&A'];

  const getCategoryIcon = (cat: MaterialCategory) => {
    switch (cat) {
      case 'AV Summary': return <Tv className="w-5 h-5" />;
      case 'Notes': return <FileText className="w-5 h-5" />;
      case 'Slides': return <FileType className="w-5 h-5" />;
      case 'Assignments': return <CheckSquare className="w-5 h-5" />;
      case 'Q&A': return <MessageCircle className="w-5 h-5" />;
    }
  };

  const handlePdfClick = (material: FlatMaterial) => {
    const url = material.download_url || material.github_url || '';
    const title = material.title || material.name || 'Document';
    if (url) {
      setSelectedPdf({ id: material.id, url, title });
      setIsPdfSidebarOpen(true);
    }
  };

  // --- Video Player Logic ---
  const renderVideoView = () => {
    const videos = groupedMaterials['AV Summary'];
    if (videos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
            <Tv className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Videos Available</h3>
          <p className="text-white/40 max-w-md mx-auto">
            Video summaries have not been uploaded for this unit yet.
          </p>
          {isModerator && (
            <button
              onClick={() => setAddingMaterial({ category: 'AV Summary', unitId: selectedUnitId! })}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add Video
            </button>
          )}
        </div>
      );
    }

    const currentUrl = playingVideoUrl || videos[0]?.video_url || videos[0]?.download_url || '';
    const currentVideo = videos.find(v => v.video_url === currentUrl || v.download_url === currentUrl) || videos[0];

    return (
      <div className="flex flex-col lg:flex-row h-full">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-5xl mx-auto">
            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
              {currentUrl ? (
                currentUrl.includes('vimeo.com') ? (
                  <iframe 
                    src={currentUrl.includes('player.vimeo.com') ? currentUrl : currentUrl.replace('vimeo.com', 'player.vimeo.com/video')} 
                    className="w-full h-full" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video controls className="w-full h-full object-contain">
                    <source src={currentUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/50 font-mono">No valid video URL</span>
                </div>
              )}
            </div>

            <div className="mt-8 px-2 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                  {currentVideo.title || currentVideo.name || 'Untitled Video'}
                </h1>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-lg border border-primary/20">Class {currentVideo.classIndex}</span>
                  <span className="text-white/70">{currentVideo.className}</span>
                  {currentVideo.faculty && <span className="text-white/40">• Prof. {currentVideo.faculty}</span>}
                </div>
              </div>
              {isModerator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMaterial(currentVideo);
                    setEditForm({
                      title: currentVideo.title || '',
                      name: currentVideo.name || '',
                      download_url: currentVideo.download_url || '',
                      video_url: currentVideo.video_url || '',
                      provider: currentVideo.provider || '',
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium text-sm border border-white/10"
                >
                  <Edit2 className="w-4 h-4" /> Edit Video
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div className="flex-1 bg-surface/50 border-r border-white/[0.05] flex flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 flex-shrink-0 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Tv className="w-6 h-6 text-primary" /> AV Summary
            </h2>
            {isModerator && (
              <button
                onClick={() => setAddingMaterial({ category: 'AV Summary', unitId: selectedUnitId! })}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-xl text-sm font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> Add Video
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {videos.map((video, idx) => {
              const videoUrl = video.video_url || video.download_url || '';
              const isPlaying = currentUrl === videoUrl;
              return (
                <button
                  key={video.id}
                  onClick={() => setPlayingVideoUrl(videoUrl)}
                  className={`w-full text-left p-3 rounded-2xl flex gap-4 transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-primary/[0.08] border-l-4 border-l-primary shadow-sm' 
                      : 'bg-transparent border-l-4 border-l-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative w-28 h-[72px] bg-black rounded-xl border border-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                    {isPlaying ? (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                        <AudioLines className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    ) : (
                      <PlayCircle className="w-8 h-8 text-white/40 transition-transform group-hover:scale-110" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                    <h4 className={`text-sm font-semibold truncate tracking-tight ${isPlaying ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                      {video.title || video.name || `Lecture ${idx + 1}`}
                    </h4>
                    <p className="text-xs text-white/40 truncate mt-1.5 font-medium">Class {video.classIndex}: {video.className}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Standard Materials View (Notes, Slides, etc) ---
  const renderStandardView = () => {
    const materials = groupedMaterials[selectedCategory];
    
    if (materials.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
            {getCategoryIcon(selectedCategory)}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Documents Found</h3>
          <p className="text-white/40 max-w-md mx-auto">
            No materials have been uploaded for this category yet. Check back later or explore other units.
          </p>
          {isModerator && (
            <button
              onClick={() => setAddingMaterial({ category: selectedCategory, unitId: selectedUnitId! })}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add {selectedCategory}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div className="mb-8 pl-2">
          <h2 className="text-3xl font-bold text-white/90 flex items-center gap-4 tracking-tight">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-inner border border-primary/20">
              {getCategoryIcon(selectedCategory)}
            </span>
            {selectedCategory}
            
            {isModerator && (
              <button
                onClick={() => setAddingMaterial({ category: selectedCategory, unitId: selectedUnitId! })}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-xl text-sm font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> Add File
              </button>
            )}
          </h2>
          <p className="text-white/50 font-mono mt-3 text-sm">Showing {materials.length} files in chronological order.</p>
        </div>

        <div className="space-y-4">
          {materials.map(material => (
            <div 
              key={material.id}
              onClick={() => handlePdfClick(material)}
              className="flex flex-col md:flex-row md:items-center p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group relative"
            >
              {/* Left Side: Class Info */}
              <div className="flex-shrink-0 w-full md:w-56 mb-4 md:mb-0 md:pr-6 md:border-r border-white/5">
                <span className="px-2.5 py-1 bg-white/[0.06] rounded-md text-[10px] font-mono font-bold text-white/70 mb-2.5 inline-block tracking-wide">
                  Class {material.classIndex}
                </span>
                <p className="text-xs text-white/50 line-clamp-2 leading-relaxed font-medium">
                  {material.className}
                </p>
              </div>

              {/* Right Side: Material Info */}
              <div className="flex-1 md:pl-8 flex items-center justify-between min-w-0 pr-8">
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-semibold text-white/90 group-hover:text-primary transition-colors truncate tracking-tight">
                    {material.title || material.name || 'Untitled Document'}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40 font-mono uppercase tracking-wider font-semibold truncate">
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <Download className="w-3 h-3" />
                      {material.extension || 'PDF'}
                    </span>
                    {material.faculty && <span className="truncate">• {material.faculty}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isModerator && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMaterial(material);
                        setEditForm({
                          title: material.title || '',
                          name: material.name || '',
                          download_url: material.download_url || '',
                          video_url: material.video_url || '',
                          provider: material.provider || '',
                        });
                      }}
                      className="p-3 rounded-xl bg-white/5 text-text-muted hover:bg-primary/20 hover:text-primary transition-all duration-300 shadow-sm"
                      title="Edit Material"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                  <div className="p-3 rounded-xl bg-white/5 text-white/60 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                    <Download className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- PDF Navigation Logic ---
  let currentMaterials: FlatMaterial[] = [];
  let hasNextPdf = false;
  let hasPrevPdf = false;
  let handleNextPdf = undefined;
  let handlePrevPdf = undefined;
  let nextPdfTitle = '';
  let prevPdfTitle = '';

  if (selectedPdf) {
    currentMaterials = groupedMaterials[selectedCategory].filter(m => m.extension === 'pdf' || !m.video_url);
    const currentIndex = currentMaterials.findIndex(m => m.id === selectedPdf.id);
    
    hasNextPdf = currentIndex >= 0 && currentIndex < currentMaterials.length - 1;
    hasPrevPdf = currentIndex > 0;

    if (hasNextPdf) {
      const nextMat = currentMaterials[currentIndex + 1];
      nextPdfTitle = nextMat.title || nextMat.name || 'Document';
      handleNextPdf = () => {
        const nextUrl = nextMat.download_url || nextMat.github_url || '';
        if (nextUrl) setSelectedPdf({ id: nextMat.id, url: nextUrl, title: nextPdfTitle });
      };
    }
    
    if (hasPrevPdf) {
      const prevMat = currentMaterials[currentIndex - 1];
      prevPdfTitle = prevMat.title || prevMat.name || 'Document';
      handlePrevPdf = () => {
        const prevUrl = prevMat.download_url || prevMat.github_url || '';
        if (prevUrl) setSelectedPdf({ id: prevMat.id, url: prevUrl, title: prevPdfTitle });
      };
    }
  }

  return (
    <div className="font-sans antialiased w-full min-h-full flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex-shrink-0 p-4 md:p-6 lg:px-10 lg:pt-8 border-b border-white/[0.05] bg-background">
        <button 
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-sm font-mono text-white/50 hover:text-white mb-4 lg:mb-5 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/95 tracking-tight">{course.course_title}</h1>
          <span className="w-fit px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-mono font-bold">
            {course.course_code}
          </span>
          {isModerator && (
            <div className="ml-auto flex items-center gap-2">
              {syncQueue.length > 0 && (
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync {syncQueue.length} Changes
                </button>
              )}
              <button 
                onClick={() => {
                  setCourseForm({ course_title: course.course_title, course_code: course.course_code });
                  setEditingCourse(true);
                }}
                className="p-2 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-xl transition-colors"
                title="Edit Course"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDeleteCourse}
                disabled={isSaving}
                className="p-2 bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded-xl transition-colors"
                title="Delete Course"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Unit Selector */}
      <div className="flex-shrink-0 border-b border-white/[0.05] bg-surface/20">
        <div className="flex overflow-x-auto custom-scrollbar px-6 md:px-10 py-3.5 gap-3">
          {course.units.map((unit) => (
            <div key={unit.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedUnitId(unit.id)}
                title={unit.title}
                className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                  selectedUnitId === unit.id 
                    ? 'bg-white text-background shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
                    : 'bg-white/[0.03] border border-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[160px]">
                  {unit.title}
                </span>
              </button>
              {isModerator && selectedUnitId === unit.id && (
                <button
                  onClick={() => {
                    setUnitForm({ title: unit.title });
                    setEditingUnitId(unit.id);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors ml-1"
                  title="Edit Unit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {isModerator && (
            <button
              onClick={() => setAddingUnit(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] border-dashed rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-all duration-300 flex-shrink-0"
              title="Add New Unit"
            >
              <Plus className="w-4 h-4" /> Add Unit
            </button>
          )}

          {course.units.length === 0 && (
            <div className="text-sm text-white/40 py-2">No units available.</div>
          )}
        </div>
      </div>

      {/* Split View Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-background relative min-w-0">
        
        {/* Edge Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 items-center justify-center w-5 h-14 bg-surface border border-white/10 shadow-[2px_0_15px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white/50 hover:text-white rounded-r-xl ${
            isSidebarOpen ? 'left-[88px]' : 'left-0'
          }`}
          title="Toggle Categories Sidebar"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 -ml-0.5" />}
        </button>
        
        {/* Left Sidebar: Categories (Collapsible on Desktop, Horizontal on Mobile) */}
        <div className={`transition-all duration-300 border-b lg:border-b-0 lg:border-r border-white/[0.05] bg-surface/10 overflow-x-auto lg:overflow-y-auto custom-scrollbar flex-shrink-0 flex flex-col lg:items-center ${
          isSidebarOpen ? 'w-full lg:w-[88px] p-4 opacity-100' : 'h-0 lg:w-0 lg:h-auto opacity-0 p-0 border-0 overflow-hidden'
        }`}>
          <div className="lg:hidden text-xs font-mono text-white/40 font-semibold uppercase tracking-widest mb-3 px-2 whitespace-nowrap">
            Categories
          </div>
          
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 w-max lg:w-full">
            {categories.map((cat) => {
              const count = groupedMaterials[cat].length;
              const isActive = selectedCategory === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedPdf(null); // Clear PDF view if changing categories
                    if (cat !== 'AV Summary') setPlayingVideoUrl(null);
                  }}
                  className={`flex-shrink-0 lg:w-14 lg:h-14 flex items-center justify-center p-3 lg:p-0 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-white shadow-[inset_0_-4px_0_rgba(139,92,246,1)] lg:shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                      : 'bg-transparent border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                  }`}
                  title={`${cat} (${count})`}
                >
                  <div className="flex items-center gap-3.5 lg:gap-0">
                    <div className={`p-2 lg:p-0 rounded-xl lg:rounded-none transition-colors ${isActive ? 'bg-primary lg:bg-transparent text-white lg:text-primary shadow-[0_0_15px_rgba(139,92,246,0.4)] lg:shadow-none' : 'bg-white/5 lg:bg-transparent text-white/50'}`}>
                      {getCategoryIcon(cat)}
                    </div>
                    {/* Text is hidden on desktop */}
                    <span className="lg:hidden font-semibold tracking-tight whitespace-nowrap">{cat}</span>
                  </div>
                  {/* Count badge is hidden on desktop */}
                  <span className={`lg:hidden text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-transparent overflow-hidden flex flex-col min-w-0">
          <div className="h-full overflow-y-auto custom-scrollbar min-w-0">
            {selectedCategory === 'AV Summary' ? renderVideoView() : renderStandardView()}
          </div>
        </div>
      </div>

      {/* PDF Modal Overlay */}
      {selectedPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-2 md:p-6 lg:p-8">
          <div className="bg-background w-full h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex relative animate-in zoom-in-95 duration-300">
            
            {/* Main PDF Viewer */}
            <div className="flex-1 h-full min-w-0">
              <InlinePdfViewer 
                url={selectedPdf.url} 
                title={selectedPdf.title} 
                onClose={() => setSelectedPdf(null)} 
                onNext={handleNextPdf}
                onPrev={handlePrevPdf}
                hasNext={hasNextPdf}
                hasPrev={hasPrevPdf}
                nextTitle={nextPdfTitle}
                prevTitle={prevPdfTitle}
                isSidebarOpen={isPdfSidebarOpen}
                onToggleSidebar={() => setIsPdfSidebarOpen(!isPdfSidebarOpen)}
              />
            </div>

            {/* Collapsible Playlist Sidebar */}
            <div className={`
              absolute inset-y-0 right-0 z-50 md:relative md:z-0
              flex flex-col bg-background/95 backdrop-blur-xl md:bg-surface/30 md:backdrop-blur-none
              border-l border-white/[0.05] transition-all duration-300 flex-shrink-0
              ${isPdfSidebarOpen 
                ? 'w-full md:w-[320px] translate-x-0 opacity-100' 
                : 'w-full md:w-0 translate-x-full md:translate-x-0 overflow-hidden border-none opacity-0 md:opacity-100'
              }
            `}>
              <div className="p-4 md:p-6 border-b border-white/[0.05] flex-shrink-0 min-w-[320px] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white/90">Unit Materials</h3>
                  <p className="text-xs text-white/50 font-mono mt-1">{groupedMaterials[selectedCategory].length} documents</p>
                </div>
                <button 
                  onClick={() => setIsPdfSidebarOpen(false)}
                  className="md:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-w-[320px]">
                {groupedMaterials[selectedCategory].map((m, idx) => {
                  const isActive = selectedPdf.url === (m.download_url || m.github_url || '');
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPdf({ id: m.id, url: m.download_url || m.github_url || '', title: m.title || m.name || '' });
                        if (window.innerWidth < 768) setIsPdfSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-colors border flex items-start gap-3 ${
                        isActive 
                          ? 'bg-primary/10 border-primary/30 text-white' 
                          : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                        {getCategoryIcon(selectedCategory)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate leading-tight">{m.title || m.name || `Document ${idx+1}`}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/50'}`}>
                            Class {m.classIndex || idx + 1}
                          </span>
                          <span className="text-[10px] text-white/40 truncate">{m.className}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {addingMaterial && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setAddingMaterial(null)}></div>
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Add {addingMaterial.category}</h3>
              <button onClick={() => setAddingMaterial(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Title / Name</label>
                <input
                  type="text"
                  value={addMatForm.name || ''}
                  onChange={(e) => setAddMatForm({ ...addMatForm, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. Chapter 1 Notes"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  {addingMaterial.category === 'AV Summary' ? 'Video URL' : 'Download URL'}
                </label>
                <input
                  type="url"
                  value={addMatForm.download_url || ''}
                  onChange={(e) => setAddMatForm({ ...addMatForm, download_url: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              {addingMaterial.category === 'AV Summary' && (
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Provider</label>
                  <select
                    value={addMatForm.provider || ''}
                    onChange={(e) => setAddMatForm({ ...addMatForm, provider: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="">Select Provider...</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="youtube">YouTube</option>
                    <option value="aws_s3">AWS S3</option>
                    <option value="gdrive">Google Drive</option>
                    <option value="external">External Link</option>
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setAddingMaterial(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleAddMaterial} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingCourse(false)}></div>
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Edit Course</h3>
              <button onClick={() => setEditingCourse(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors">
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
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Course Code</label>
                <input
                  type="text"
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setEditingCourse(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleSaveCourse} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {editingUnitId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingUnitId(null)}></div>
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Edit Unit Name</h3>
              <button onClick={() => setEditingUnitId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Unit Title</label>
                <input
                  type="text"
                  value={unitForm.title}
                  onChange={(e) => setUnitForm({ title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setEditingUnitId(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleSaveUnit} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {addingUnit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setAddingUnit(false)}></div>
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Add New Unit</h3>
              <button onClick={() => setAddingUnit(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Unit Title</label>
                <input
                  type="text"
                  value={newUnitForm.title}
                  onChange={(e) => setNewUnitForm({ title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. Unit 6: Advanced Topics"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setAddingUnit(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleAddUnit} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add Unit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setEditingMaterial(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Edit Material</h3>
                <p className="text-xs text-text-muted mt-1 font-mono">ID: {editingMaterial.id}</p>
              </div>
              <button 
                onClick={() => setEditingMaterial(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20"
                  placeholder="Material Title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  Internal Name
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20"
                  placeholder="Internal Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  Download URL
                </label>
                <input
                  type="url"
                  value={editForm.download_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, download_url: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              {getMaterialCategory(editingMaterial) === 'AV Summary' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={editForm.video_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20 font-mono text-xs"
                      placeholder="https://vimeo.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                      Provider
                    </label>
                    <select
                      value={editForm.provider || ''}
                      onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                    >
                      <option value="">Select Provider...</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="youtube">YouTube</option>
                      <option value="aws_s3">AWS S3</option>
                      <option value="gdrive">Google Drive</option>
                      <option value="external">External Link</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setEditingMaterial(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaterial}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetails;
