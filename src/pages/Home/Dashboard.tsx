import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { pesuApi, getAcademicStatus } from '../../api/pesu';
import {
  Network,
  Activity,
  Zap,
  Clock,
  Terminal,
  ServerCrash,
  Cpu,
  ChevronRight,
  Sparkles,
  Loader2,
  CalendarDays,
  AlertCircle,
  X,
  Database
} from 'lucide-react';

interface TimetableEntry {
  subject: string;
  code: string;
  teacher: string;
  room: string;
  time: string;
  dayNum: number;
  startTimeRaw: string;
}

const DAYS_MAP: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Timetable State
  const [allTimetableData, setAllTimetableData] = useState<TimetableEntry[]>([]);
  const [nextClass, setNextClass] = useState<TimetableEntry | null>(null);
  const [chillMessage, setChillMessage] = useState<string | null>(null);

  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialStatus, setSpecialStatus] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    pesuApi.getIsa().then((isaResponse: any) => {
      if (!isMounted) return;

      const status = getAcademicStatus(isaResponse, user.semester);
      if (status) {
        setSpecialStatus(status);
        // Skip fetching timetable since the message replaces it!
        return;
      }

      // If no special status, proceed to fetch timetable
      setTimetableLoading(true);
      pesuApi.getTimetable()
        .then(response => {
          if (!isMounted) return;
          const rawClasses = Array.isArray(response) ? response : [];

          const formattedClasses: TimetableEntry[] = rawClasses.map((cls: any) => ({
            subject: cls.subjectName || 'Unknown',
            code: cls.subjectCode || 'N/A',
            teacher: cls.facultyName || 'TBA',
            room: cls.roomName || 'N/A',
            time: `${cls.startTime.substring(0, 5)} - ${cls.endTime.substring(0, 5)}`,
            dayNum: cls.day,
            startTimeRaw: cls.startTime
          })).sort((a, b) => a.startTimeRaw.localeCompare(b.startTimeRaw));

          setAllTimetableData(formattedClasses);
          calculateNextClass(formattedClasses);
        })
        .catch(err => {
          if (!isMounted) return;
          setTimetableError(err.message === 'CREDENTIALS_MISSING'
            ? 'Credentials missing.'
            : 'Uplink failed.');
        })
        .finally(() => {
          if (isMounted) setTimetableLoading(false);
        });

    }).catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' T-SYS');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check next class every minute
    const interval = setInterval(() => {
      if (allTimetableData.length > 0) calculateNextClass(allTimetableData);
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [allTimetableData]);

  const calculateNextClass = (classes: TimetableEntry[]) => {
    const now = new Date();
    const todayNum = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}:00`;

    let upcomingClass: TimetableEntry | null = null;

    // 1. Check if there is a class left TODAY
    const todaysClasses = classes.filter(c => c.dayNum === todayNum);
    const upcomingToday = todaysClasses.find(c => c.startTimeRaw > currentTimeStr);

    if (upcomingToday) {
      upcomingClass = upcomingToday;
    } else {
      // 2. If no classes left today, find the FIRST class of the NEXT available day
      for (let offset = 1; offset <= 7; offset++) {
        let nextDayNum = (todayNum + offset) % 7;
        if (nextDayNum === 0) continue; // Skip Sunday

        const nextDaysClasses = classes.filter(c => c.dayNum === nextDayNum);
        if (nextDaysClasses.length > 0) {
          upcomingClass = nextDaysClasses[0]; // The first class of that day
          break;
        }
      }
    }

    if (!upcomingClass) {
      setNextClass(null);
      setChillMessage("No upcoming classes found in system.");
      return;
    }

    // Calculate exact Date of the upcoming class
    let daysToAdd = 0;
    if (upcomingClass.dayNum > todayNum) {
      daysToAdd = upcomingClass.dayNum - todayNum;
    } else if (upcomingClass.dayNum < todayNum) {
      daysToAdd = 7 - todayNum + upcomingClass.dayNum;
    } else {
      // It's today, but let's just double check it hasn't passed (shouldn't happen based on above logic)
      if (upcomingClass.startTimeRaw <= currentTimeStr) {
        daysToAdd = 7;
      }
    }

    const nextClassDate = new Date(now);
    nextClassDate.setDate(now.getDate() + daysToAdd);
    const [h, m, s] = upcomingClass.startTimeRaw.split(':').map(Number);
    nextClassDate.setHours(h, m, s || 0, 0);

    const diffMs = nextClassDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 4) {
      setNextClass(upcomingClass);
      setChillMessage(null);
    } else {
      setNextClass(null);
      // Determine a fun chill message based on the gap
      if (daysToAdd >= 2 || todayNum === 6) {
        setChillMessage("Weekend vibes. Chill mode activated.");
      } else {
        setChillMessage("Day completed. Rest up for tomorrow!");
      }
    }
  };

  // Helper to group timetable by day for the modal
  const classesByDay = [1, 2, 3, 4, 5, 6].map(dayNum => ({
    dayName: DAYS_MAP[dayNum],
    classes: allTimetableData.filter(c => c.dayNum === dayNum)
  }));

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full space-y-6 md:space-y-8 animate-in fade-in duration-700 relative">

      {/* Background ambient glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] mix-blend-screen"></div>
      </div>

      {/* Holo-Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-surface/50 backdrop-blur-2xl border border-white/5 p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

        {/* Subtle grid mesh overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">

          {/* Avatar with cyber rings */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-[-8px] rounded-full border border-dashed border-secondary/30 animate-[spin_8s_linear_infinite_reverse]"></div>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.3)] bg-background flex-shrink-0 relative z-10">
              {!user ? (
                <div className="w-full h-full bg-white/5 animate-pulse" />
              ) : user.photo ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 w-full h-full bg-white/5 animate-pulse flex items-center justify-center rounded-full">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  <img 
                    src={user.photo} 
                    alt="Profile" 
                    className={`w-full h-full object-cover rounded-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
                    onLoad={() => setImageLoaded(true)}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background border border-primary/50 text-primary text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)] z-20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Online
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-text-muted mb-4 uppercase tracking-widest">
              <Terminal className="w-3 h-3 text-secondary" />
              <span>SYS_TIME: {currentTime}</span>
            </div>

            {!user ? (
              <div className="space-y-4 mb-6 pt-2">
                <div className="h-10 md:h-14 w-64 bg-white/10 animate-pulse rounded-2xl mx-auto md:mx-0" />
                <div className="h-6 w-32 bg-white/5 animate-pulse rounded-xl mx-auto md:mx-0" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
                  {greeting}, <br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent animate-gradient-x">
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                </h1>

                <p className="text-lg text-text-muted/80 font-mono mb-6 uppercase tracking-widest">
                  ID: {user.srn}
                </p>
              </>
            )}

            {/* Glowing System Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {!user ? (
                <>
                  <div className="h-10 w-32 bg-primary/20 animate-pulse rounded-xl border border-primary/10" />
                  <div className="h-10 w-24 bg-secondary/20 animate-pulse rounded-xl border border-secondary/10" />
                  <div className="h-10 w-24 bg-pink-500/20 animate-pulse rounded-xl border border-pink-500/10" />
                </>
              ) : (
                <>
                  <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <Cpu className="w-4 h-4" />
                    {user.program || 'Program_N/A'}
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                    <Activity className="w-4 h-4" />
                    {user.semester ? `${user.semester}` : 'Sem_N/A'}
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                    <Network className="w-4 h-4" />
                    {user.section ? `Sec_${user.section}` : 'Sec_N/A'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">

        {/* Main Command Center (Spans 2 cols, 2 rows) */}
        <Link to="/notes" className="row-span-2 md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 p-8 transition-all duration-500 hover:border-pink-500/40 hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] hover:-translate-y-1 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform">
            <ServerCrash className="w-32 h-32 text-pink-400" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <Database className="w-3 h-3" />
                Data Banks
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Study Materials</h2>
              <p className="text-text-muted max-w-sm">Access comprehensive study materials, notes, slides, and previous year questions.</p>
            </div>

            <div className="flex items-center gap-2 text-pink-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Access Vault <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Academics Node */}
        <Link to="/academics" className="md:row-span-2 group relative overflow-hidden rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 p-6 transition-all duration-500 hover:border-secondary/40 hover:shadow-[0_0_30px_rgba(14,165,233,0.2)] hover:-translate-y-1 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div>
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Attendance Matrix</h3>
            <p className="text-sm text-text-muted">Monitor your academic presence and metrics.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center h-full">
            {specialStatus ? (
              <span className="text-[10px] font-mono uppercase tracking-widest text-center text-secondary leading-relaxed p-2 bg-secondary/10 rounded-xl border border-secondary/20">
                {specialStatus}
              </span>
            ) : (
              <div className="flex items-end justify-between w-full">
                <div className="text-3xl font-black text-white">80<span className="text-lg text-secondary">%</span></div>
                <div className="text-xs font-mono text-success flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Optimal
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Events Node */}
        <Link to="/events" className="group relative overflow-hidden rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:-translate-y-1 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Events</h3>
              <p className="text-sm text-text-muted">Explore ongoing events across all campuses</p>
            </div>
          </div>
        </Link>

        {/* Live Uplink: Next Class Node */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative overflow-hidden rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 p-6 transition-all duration-500 hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:-translate-y-1 text-left flex flex-col cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 h-full flex flex-col w-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0 w-full">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest font-mono">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Timetable
              </h3>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {timetableLoading ? (
                <div className="w-full flex flex-col items-center justify-center text-purple-400/50">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-mono uppercase">Syncing...</span>
                </div>
              ) : timetableError ? (
                <div className="w-full flex flex-col items-center justify-center text-red-400/50">
                  <AlertCircle className="w-6 h-6 mb-2" />
                  <span className="text-xs font-mono uppercase">{timetableError}</span>
                </div>
              ) : specialStatus ? (
                <div className="w-full flex flex-col items-center justify-center text-text-muted/80">
                  <Sparkles className="w-8 h-8 mb-3 opacity-50 text-purple-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-center leading-relaxed text-purple-300">
                    {specialStatus}
                  </span>
                </div>
              ) : chillMessage && !nextClass ? (
                <div className="w-full flex flex-col items-center justify-center text-text-muted/80">
                  <CalendarDays className="w-8 h-8 mb-3 opacity-50 text-purple-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-center leading-relaxed text-purple-300">
                    {chillMessage}
                  </span>
                </div>
              ) : nextClass ? (
                <div className="w-full relative">
                  {chillMessage && (
                    <p className="text-[10px] font-mono uppercase text-purple-400/70 mb-2 border-l-2 border-purple-500/50 pl-2">
                      {chillMessage}
                    </p>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm text-purple-400 font-semibold">{nextClass.time}</span>
                    <span className="font-mono text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-md">{nextClass.room}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-tight mb-1">{nextClass.subject}</h4>
                  <div className="flex justify-between items-end mt-4">
                    <p className="text-xs text-text-muted font-mono">{nextClass.teacher}</p>
                    <span className="text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform duration-300">
                      {DAYS_MAP[nextClass.dayNum]} <ChevronRight className="inline w-3 h-3" />
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </button>

      </div>

      {/* Holographic Timetable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-5xl max-h-[85vh] bg-surface/80 border border-purple-500/30 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Network className="w-6 h-6 text-purple-500" />
                Global Schedule Matrix
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classesByDay.map((dayData, i) => (
                  <div key={i} className="bg-background/50 border border-white/5 rounded-2xl p-5 flex flex-col h-[300px]">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                      {dayData.dayName}
                      <span className="text-xs font-mono bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                        {dayData.classes.length} Nodes
                      </span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                      {dayData.classes.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-text-muted/50 font-mono text-sm uppercase">
                          System Rest
                        </div>
                      ) : (
                        dayData.classes.map((cls, idx) => (
                          <div key={idx} className="bg-surface border border-white/5 rounded-xl p-3 hover:border-purple-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-mono text-xs text-purple-400">{cls.time}</span>
                              <span className="font-mono text-[10px] bg-white/5 text-text-muted px-1.5 py-0.5 rounded">{cls.room}</span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate mb-1">{cls.subject}</p>
                            <p className="text-xs text-text-muted truncate">{cls.teacher}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
