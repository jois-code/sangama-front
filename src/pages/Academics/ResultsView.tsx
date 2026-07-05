import React, { useEffect, useState, useMemo } from 'react';
import { pesuApi } from '../../api/pesu';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

const ResultsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [apiData, setApiData] = useState<any>(null);
  const [cgpaData, setCgpaData] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const [esaAdjustments, setEsaAdjustments] = useState<Record<string, number>>({});
  const { pesuSyncProgress } = useAuth();

  const fetchData = async (forceRefresh = false) => {
    const batchId = selectedSemester ? parseInt(selectedSemester) : undefined;
    const sectionId = selectedSection ? parseInt(selectedSection) : undefined;
    
    const payload: any = {};
    if (batchId !== undefined && batchId !== null && !isNaN(batchId)) payload.batchClassId = batchId;
    if (sectionId !== undefined && sectionId !== null && !isNaN(sectionId)) payload.classBatchSectionId = sectionId;
    
    const cacheKey = `pesu_cache_isa_${JSON.stringify(payload)}`;
    const isCached = !forceRefresh && localStorage.getItem(cacheKey);
    
    if (!isCached || !apiData) {
      setLoading(true);
    }
    
    setError(null);
    try {
      const [isaResponse, cgpaResponse] = await Promise.all([
        pesuApi.getIsa(batchId, sectionId, forceRefresh),
        pesuApi.getCgpa(forceRefresh).catch(() => null)
      ]);

      if (!isaResponse.success) {
        throw new Error('API returned unsuccessful response');
      }

      setApiData(isaResponse);
      if (cgpaResponse) setCgpaData(cgpaResponse);

      // Initialize ESA sliders if not already set for these subjects
      const initialAdjustments: Record<string, number> = { ...esaAdjustments };
      isaResponse.marks.forEach((sub: any) => {
        if (initialAdjustments[sub.code] === undefined) {
          initialAdjustments[sub.code] = sub.structure.esa_max_default || 100;
        }
      });
      setEsaAdjustments(initialAdjustments);

      if (!selectedSemester && isaResponse.selected_batch_id) {
        setSelectedSemester(isaResponse.selected_batch_id);
        // find matching section
        const match = isaResponse.semesters.find((s: any) => s.id === isaResponse.selected_batch_id);
        if (match) setSelectedSection(match.section_id);
      }
    } catch (err: any) {
      if (err.message === 'CREDENTIALS_MISSING') {
        setError('Your login credentials are missing. Please log out and log in again.');
      } else {
        setError(`Failed to fetch results from PESU.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemester || selectedSection) {
      // If we already have the data for this semester, don't fetch again
      if (apiData && String(apiData.selected_batch_id) === String(selectedSemester)) {
        return;
      }
      fetchData();
      return;
    }
    const isCachedIsa = localStorage.getItem('pesu_cache_isa_{}');
    const isCachedCgpa = localStorage.getItem('pesu_cache_cgpa_{}');
    if (isCachedIsa && isCachedCgpa) {
      fetchData();
    } else if (pesuSyncProgress === 0) {
      fetchData();
    }
  }, [selectedSemester, selectedSection, pesuSyncProgress]);

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [batchId, sectionId] = val.split('|');
    setSelectedSemester(batchId);
    setSelectedSection(sectionId);
  };

  const updateEsaAdjustment = (code: string, value: number) => {
    setEsaAdjustments(prev => ({ ...prev, [code]: value }));
  };

  const calculatedData = useMemo(() => {
    if (!apiData) return { subjects: [], sgpa: '0.00', totalCredits: 0 };

    let totalCredits = 0;
    let earnedPoints = 0;

    const subjects = apiData.marks.map((sub: any) => {
      // Restore original logic
      const isCompleted = !!apiData.actual_sgpa && apiData.actual_sgpa !== 'N/A' && !!sub.actual_grade;

      let currentGrade = 'F';
      let currentPoints = 0;
      let currentBg = 'bg-red-600';
      let percentage = 0;
      let totalMarks = 0;
      let esaScore = sub.structure.esa_max_default;

      if (isCompleted) {
        currentGrade = sub.actual_grade;
        const gradeDef = apiData.grade_scale.find((g: any) => g.grade === currentGrade);
        if (gradeDef) {
          currentPoints = gradeDef.points;
          if (currentGrade === 'S') currentBg = 'bg-green-500';
          else if (currentGrade === 'A') currentBg = 'bg-teal-500';
          else if (currentGrade === 'B') currentBg = 'bg-blue-500';
          else if (currentGrade === 'C') currentBg = 'bg-yellow-500';
          else if (currentGrade === 'D') currentBg = 'bg-orange-500';
          else if (currentGrade === 'E') currentBg = 'bg-red-400';
        }
        totalMarks = sub.internal_fixed + (sub.has_assignment ? sub.assignment_marks : 0) + (sub.has_lab ? sub.structure.lab_weight : 0);
      } else {
        esaScore = esaAdjustments[sub.code] ?? sub.structure.esa_max_default;
        const scaledEsa = esaScore * (sub.structure.esa_weight / sub.structure.esa_max_default);
        totalMarks = sub.internal_fixed + (sub.has_assignment ? sub.assignment_marks : 0) + (sub.has_lab ? sub.structure.lab_weight : 0) + scaledEsa;
        percentage = (totalMarks / sub.structure.total_marks) * 100;

        for (const gradeDef of apiData.grade_scale) {
          if (percentage >= gradeDef.min) {
            currentGrade = gradeDef.grade;
            currentPoints = gradeDef.points;
            if (currentGrade === 'S') currentBg = 'bg-green-500';
            else if (currentGrade === 'A') currentBg = 'bg-teal-500';
            else if (currentGrade === 'B') currentBg = 'bg-blue-500';
            else if (currentGrade === 'C') currentBg = 'bg-yellow-500';
            else if (currentGrade === 'D') currentBg = 'bg-orange-500';
            else if (currentGrade === 'E') currentBg = 'bg-red-400';
            break;
          }
        }
      }

      totalCredits += sub.credits;
      earnedPoints += (sub.credits * currentPoints);

      return {
        ...sub,
        currentGrade,
        currentBg,
        currentPercentage: percentage,
        currentTotal: totalMarks,
        esaScore,
        isCompleted
      };
    });

    // Restore actual SGPA check
    const sgpa = (apiData.actual_sgpa && apiData.actual_sgpa !== 'N/A')
      ? apiData.actual_sgpa
      : (totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : '0.00');

    return { subjects, sgpa, totalCredits };
  }, [apiData, esaAdjustments]);

  const selectedSemName = apiData?.semesters?.find(
    (s: any) => s.id === (selectedSemester || apiData?.selected_batch_id)
  )?.name || 'Current Sem';

  const currentSemNumberMatch = selectedSemName.match(/\d+/);
  const currentSemNumber = currentSemNumberMatch ? parseInt(currentSemNumberMatch[0]) : null;

  const chartData = useMemo(() => {
    if (!cgpaData?.semesters) return [];

    return cgpaData.semesters
      .filter((s: any) => s.sgpa !== 'N/A' || s.semester === currentSemNumber)
      .map((s: any) => {
        let sgpaValue = s.sgpa !== 'N/A' ? parseFloat(s.sgpa) : 0;

        if (s.semester === currentSemNumber) {
          sgpaValue = parseFloat(calculatedData.sgpa);
        }

        return {
          name: `Sem ${s.semester}`,
          sgpa: sgpaValue
        };
      })
      .filter((s: any) => s.sgpa > 0);
  }, [cgpaData, currentSemNumber, calculatedData.sgpa]);

  const predictedCgpa = useMemo(() => {
    if (!cgpaData?.semesters) return cgpaData?.cgpa || '--';

    let totalPoints = 0;
    let totalCredits = 0;

    cgpaData.semesters.forEach((s: any) => {
      let semSgpa = s.sgpa !== 'N/A' ? parseFloat(s.sgpa) : 0;
      let semCredits = parseFloat(s.credits?.total || '0') || 0;

      if (s.semester === currentSemNumber) {
        semSgpa = parseFloat(calculatedData.sgpa);
        if (semCredits === 0) {
          semCredits = calculatedData.totalCredits;
        }
      }

      if (semSgpa > 0 && semCredits > 0) {
        totalPoints += semSgpa * semCredits;
        totalCredits += semCredits;
      }
    });

    if (totalCredits === 0) return cgpaData?.cgpa || '0.00';
    return (totalPoints / totalCredits).toFixed(2);
  }, [cgpaData, currentSemNumber, calculatedData.sgpa, calculatedData.totalCredits]);

  if (loading && !apiData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>{pesuSyncProgress > 0 ? 'Background Sync in Progress...' : 'Fetching results...'}</p>
      </div>
    );
  }

  if (error && !apiData) {
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

  if (!apiData) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm font-medium text-text-muted mb-1">Overall CGPA</p>
          <h1 className="text-4xl font-bold text-primary">{predictedCgpa}</h1>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm font-medium text-text-muted mb-1">
            {(apiData.actual_sgpa && apiData.actual_sgpa !== 'N/A') ? `${selectedSemName} SGPA` : `${selectedSemName} Predicted`}
          </p>
          <h1 className="text-4xl font-bold text-primary">{calculatedData.sgpa}</h1>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm font-medium text-text-muted mb-1">Total Credits</p>
          <h1 className="text-4xl font-bold text-text">
            {(apiData.actual_credits_total && apiData.actual_credits_total !== 'N/A' && apiData.actual_credits_total !== '')
              ? apiData.actual_credits_total
              : calculatedData.totalCredits}
          </h1>
        </div>
      </div>

      {cgpaData && cgpaData.semesters && cgpaData.semesters.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <h3 className="text-lg font-semibold text-text mb-6">SGPA Progress</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="sgpa" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={['auto', 10]} stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem', color: '#f3f4f6' }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-text-muted font-medium">Semester</span>
          <select
            value={`${selectedSemester}|${selectedSection}`}
            onChange={handleSemesterChange}
            className="border border-border rounded-lg px-4 py-2 bg-surface text-text outline-none focus:ring-2 focus:ring-primary"
          >
            {apiData.semesters.map((sem: any) => (
              <option key={sem.id} value={`${sem.id}|${sem.section_id}`}>{sem.name}</option>
            ))}
          </select>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>
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

      {/* Grade Legend */}
      <div className="bg-surface border border-border rounded-xl py-4 px-6 flex flex-wrap items-center justify-center gap-6 text-sm font-bold shadow-sm text-text-muted">
        {apiData.grade_scale.map((g: any) => {
          let color = 'text-gray-500';
          if (g.grade === 'S') color = 'text-green-500';
          if (g.grade === 'A') color = 'text-teal-500';
          if (g.grade === 'B') color = 'text-blue-500';
          if (g.grade === 'C') color = 'text-yellow-500';
          if (g.grade === 'D') color = 'text-orange-500';
          if (g.grade === 'E') color = 'text-red-400';
          if (g.grade === 'F') color = 'text-red-600';
          return <span key={g.grade}><span className={color}>{g.grade}</span> {g.grade === 'F' ? '<40' : `${g.min}+`}</span>;
        })}
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {calculatedData.subjects.map((sub: any) => (
          <div key={sub.code} className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="mb-4">
              <p className="text-xs text-primary font-bold mb-1 tracking-wider">{sub.code}</p>
              <h2 className="text-base font-semibold text-text leading-tight line-clamp-2">{sub.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{sub.credits} Cr</span>
                <span className="text-xs text-text-muted font-medium">{sub.structure.total_marks} marks</span>
              </div>
            </div>

            {/* Internal Assessment */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-bold text-text-muted tracking-wider uppercase">Internal Assessment (Fixed)</h4>

              {sub.components.map((comp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted font-medium">{comp.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">{comp.marks}/{comp.max_marks}</span>
                    <span className="text-primary font-medium">→ {comp.scaled}/{comp.scaled_max}</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                <span className="text-text font-bold">ISA Total</span>
                <span className="text-primary font-bold">
                  {sub.internal_fixed} / {sub.structure.isa_weight}
                </span>
              </div>
            </div>

            {/* Adjustable Components */}
            <div className="space-y-3 mb-5">
              <h4 className="text-[10px] font-bold text-text-muted tracking-wider uppercase">Adjustable Components</h4>

              {sub.has_assignment && (
                <div className="bg-black/20 rounded-xl p-3 space-y-2 mb-2">
                  <div className="text-[10px] text-green-500 font-medium mb-1">Assignment Components (from PESU)</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Assignment</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text">{sub.assignment_marks}/{sub.structure.assignment_weight}</span>
                      <span className="text-primary font-medium">→ {sub.assignment_marks}</span>
                    </div>
                  </div>
                </div>
              )}

              {sub.has_lab && (
                <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Lab (Assumed Max for Prediction)</span>
                  <span className="text-primary font-bold">{sub.structure.lab_weight} / {sub.structure.lab_weight}</span>
                </div>
              )}
            </div>

            {sub.isCompleted ? (
              <div className="bg-black/10 border border-border/50 rounded-xl p-5 mt-auto flex flex-col items-center justify-center text-center backdrop-blur-sm">
                <h4 className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">Final Grade Achieved</h4>
                <span className={`${sub.currentBg} text-white font-black text-4xl px-8 py-3 rounded-3xl shadow-xl shadow-black/20 inline-block`}>
                  {sub.currentGrade}
                </span>
                <p className="text-[10px] text-text-muted mt-4 opacity-70">ESA scores are not disclosed by PESU.</p>
              </div>
            ) : (
              <>
                {/* ESA Prediction Slider */}
                <div className="bg-surface border border-border/50 rounded-xl p-4 mb-5 relative overflow-hidden mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-text">ESA (End Semester)</h4>
                      <span className="text-xl font-bold text-primary">{sub.esaScore}</span>
                    </div>
                  </div>

                  <div className="relative pt-2 pb-6">
                    <input
                      type="range"
                      min="0"
                      max={sub.structure.esa_max_default}
                      value={sub.esaScore}
                      onChange={(e) => updateEsaAdjustment(sub.code, parseInt(e.target.value))}
                      style={{
                        backgroundSize: `${(sub.esaScore / sub.structure.esa_max_default) * 100}% 100%`,
                        backgroundImage: 'linear-gradient(var(--color-primary), var(--color-primary))',
                        backgroundRepeat: 'no-repeat'
                      }}
                      className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-2 font-medium">
                      <span>0</span>
                      <span>{sub.structure.esa_max_default / 2}</span>
                      <span>{sub.structure.esa_max_default}</span>
                    </div>
                    <div className="text-center mt-2 text-xs text-text-muted">
                      ESA marks out of {sub.structure.esa_max_default}, scaled to {sub.structure.esa_weight}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-b border-border/50 py-4 mb-4 text-center">
                  <div>
                    <p className="text-[10px] text-text-muted font-medium mb-1">Predicted Grade</p>
                    <span className={`${sub.currentBg} text-white font-bold text-sm px-3 py-1 rounded-xl inline-block shadow-sm`}>
                      {sub.currentGrade}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-medium mb-1">Final %</p>
                    <div className="font-bold text-sm text-text mt-1">{sub.currentPercentage.toFixed(2)}%</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-medium mb-1">Total Marks</p>
                    <div className="font-bold text-sm text-text mt-1">
                      {sub.currentTotal.toFixed(1)} / {sub.structure.total_marks}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-text-muted space-y-2">
                  <p>Click to set ESA for grade:</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(sub.thresholds).map(([grade, data]: any) => {
                      if (!data.achievable) return null;
                      let color = 'text-gray-500';
                      if (grade === 'S') color = 'text-green-500';
                      if (grade === 'A') color = 'text-teal-500';
                      if (grade === 'B') color = 'text-blue-500';
                      if (grade === 'C') color = 'text-yellow-500';
                      if (grade === 'D') color = 'text-orange-500';
                      if (grade === 'E') color = 'text-red-400';
                      return (
                        <button
                          key={grade}
                          onClick={() => updateEsaAdjustment(sub.code, Math.ceil(data.esa_needed))}
                          className={`${color} hover:underline font-bold bg-transparent border-none p-0 cursor-pointer`}
                        >
                          {grade} ESA &ge;{Math.ceil(data.esa_needed)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsView;
