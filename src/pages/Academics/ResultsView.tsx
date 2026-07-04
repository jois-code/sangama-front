import React, { useEffect, useState, useMemo } from 'react';
import { pesuApi } from '../../api/pesu';
import { AlertCircle, Loader2 } from 'lucide-react';

const ResultsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [apiData, setApiData] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  const [esaAdjustments, setEsaAdjustments] = useState<Record<string, number>>({});

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const batchId = selectedSemester ? parseInt(selectedSemester) : undefined;
      const sectionId = selectedSection ? parseInt(selectedSection) : undefined;
      
      const response = await pesuApi.getIsa(batchId, sectionId, forceRefresh);
      
      if (!response.success) {
        throw new Error('API returned unsuccessful response');
      }
      
      setApiData(response);
      
      // Initialize ESA sliders if not already set for these subjects
      const initialAdjustments: Record<string, number> = { ...esaAdjustments };
      response.marks.forEach((sub: any) => {
        if (initialAdjustments[sub.code] === undefined) {
          initialAdjustments[sub.code] = sub.structure.esa_max_default || 100;
        }
      });
      setEsaAdjustments(initialAdjustments);
      
      if (!selectedSemester && response.selected_batch_id) {
        setSelectedSemester(response.selected_batch_id);
        // find matching section
        const match = response.semesters.find((s: any) => s.id === response.selected_batch_id);
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
    fetchData();
  }, [selectedSemester, selectedSection]);

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
      const esaScore = esaAdjustments[sub.code] ?? sub.structure.esa_max_default;
      const scaledEsa = esaScore * (sub.structure.esa_weight / sub.structure.esa_max_default);
      
      const totalMarks = sub.internal_fixed + (sub.has_assignment ? sub.assignment_marks : 0) + (sub.has_lab ? sub.structure.lab_weight : 0) + scaledEsa;
      const percentage = (totalMarks / sub.structure.total_marks) * 100;

      let currentGrade = 'F';
      let currentPoints = 0;
      let currentBg = 'bg-red-600';

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

      totalCredits += sub.credits;
      earnedPoints += (sub.credits * currentPoints);

      return {
        ...sub,
        currentGrade,
        currentBg,
        currentPercentage: percentage,
        currentTotal: totalMarks,
        esaScore
      };
    });

    const sgpa = totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : '0.00';

    return { subjects, sgpa, totalCredits };
  }, [apiData, esaAdjustments]);

  if (loading && !apiData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>Fetching results...</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm font-medium text-text-muted mb-1">Predicted SGPA</p>
          <h1 className="text-4xl font-bold text-primary">{calculatedData.sgpa}</h1>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm font-medium text-text-muted mb-1">Total Credits</p>
          <h1 className="text-4xl font-bold text-text">{calculatedData.totalCredits}</h1>
        </div>
      </div>

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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {calculatedData.subjects.map((sub: any) => (
          <div key={sub.code} className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="mb-6">
              <p className="text-xs text-primary font-bold mb-1 tracking-wider">{sub.code}</p>
              <h2 className="text-lg font-semibold text-text leading-tight line-clamp-2">{sub.name}</h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{sub.credits} Cr</span>
                <span className="text-xs text-text-muted font-medium">{sub.structure.total_marks} marks</span>
              </div>
            </div>

            {/* Internal Assessment */}
            <div className="space-y-4 mb-6">
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
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold text-text-muted tracking-wider uppercase">Adjustable Components</h4>
              
              {sub.has_assignment && (
                <div className="bg-black/20 rounded-xl p-4 space-y-3 mb-3">
                  <div className="text-xs text-green-500 font-medium mb-2">Assignment Components (from PESU)</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Assignment</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text">{sub.assignment_marks}/{sub.structure.assignment_weight}</span>
                      <span className="text-primary font-medium">→ {sub.assignment_marks}</span>
                    </div>
                  </div>
                </div>
              )}

              {sub.has_lab && (
                <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between text-sm">
                  <span className="text-text-muted">Lab (Assumed Max for Prediction)</span>
                  <span className="text-primary font-bold">{sub.structure.lab_weight} / {sub.structure.lab_weight}</span>
                </div>
              )}
            </div>

            {/* ESA Prediction Slider */}
            <div className="bg-surface border border-border/50 rounded-xl p-6 mb-8 relative overflow-hidden">
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

            <div className="grid grid-cols-3 gap-4 border-t border-b border-border/50 py-6 mb-6 text-center">
              <div>
                <p className="text-xs text-text-muted font-medium mb-1">Predicted Grade</p>
                <span className={`${sub.currentBg} text-white font-bold text-lg px-4 py-1 rounded-xl inline-block shadow-sm`}>
                  {sub.currentGrade}
                </span>
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium mb-1">Final %</p>
                <div className="font-bold text-lg text-text mt-1">{sub.currentPercentage.toFixed(2)}%</div>
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium mb-1">Total Marks</p>
                <div className="font-bold text-lg text-text mt-1">
                  {sub.currentTotal.toFixed(1)} / {sub.structure.total_marks}
                </div>
              </div>
            </div>

            <div className="text-xs text-text-muted space-y-2">
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

          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsView;
