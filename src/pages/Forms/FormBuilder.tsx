import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Check, Loader2, Plus, ArrowUp, ArrowDown, Trash2, ArrowLeft, X, Type, AlignLeft, CheckSquare, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Form Field Component ---
const FormFieldEditor = ({ field, sectionId, updateField, removeField, moveField, sections, index, totalFields }: any) => {
  const handleOptionChange = (idx: number, key: string, value: any) => {
    const newOptions = [...(field.options || [])];
    newOptions[idx] = { ...newOptions[idx], [key]: value };
    updateField(sectionId, field.id, { options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), { id: `opt_${Date.now()}`, text: `Option ${(field.options?.length || 0) + 1}` }];
    updateField(sectionId, field.id, { options: newOptions });
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4 mb-4 flex gap-4 group hover:border-primary/50 transition-colors relative z-10">
      <div className="mt-2 flex flex-col gap-1 text-text-muted">
        <button 
          onClick={() => moveField(sectionId, field.id, 'up')}
          disabled={index === 0}
          className="hover:text-text disabled:opacity-30 p-1"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button 
          onClick={() => moveField(sectionId, field.id, 'down')}
          disabled={index === totalFields - 1}
          className="hover:text-text disabled:opacity-30 p-1"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-grow space-y-4">
        <div className="flex items-start justify-between gap-4">
          <input 
            type="text" 
            value={field.label}
            onChange={(e) => updateField(sectionId, field.id, { label: e.target.value })}
            className="text-lg font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full transition-colors"
            placeholder="Question text"
          />
          <select 
            value={field.type}
            onChange={(e) => updateField(sectionId, field.id, { type: e.target.value })}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary text-text"
          >
            <option value="short_text">Short Text</option>
            <option value="paragraph">Paragraph</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="checkboxes">Checkboxes</option>
          </select>
        </div>

        {/* Options for Choice Types */}
        {['multiple_choice', 'checkboxes'].includes(field.type) && (
          <div className="space-y-2 pl-2">
            {(field.options || []).map((opt: any, idx: number) => (
              <div key={opt.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 border border-text-muted ${field.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`} />
                <input 
                  type="text" 
                  value={opt.text}
                  onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none flex-grow text-sm transition-colors"
                  placeholder={`Option ${idx + 1}`}
                />
                
                {field.type === 'multiple_choice' && sections.length > 1 && (
                  <select
                    value={opt.next_section_id || ''}
                    onChange={(e) => handleOptionChange(idx, 'next_section_id', e.target.value)}
                    className="text-xs bg-surface border border-border rounded px-2 py-1 text-text-muted max-w-[150px]"
                  >
                    <option value="">Continue to next</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.id}>Go to: {s.title}</option>
                    ))}
                  </select>
                )}
                
                <button 
                  onClick={() => {
                    const newOptions = field.options.filter((_: any, i: number) => i !== idx);
                    updateField(sectionId, field.id, { options: newOptions });
                  }}
                  className="text-text-muted hover:text-danger p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              onClick={addOption}
              className="text-sm text-primary hover:underline font-medium flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          </div>
        )}

        <div className="flex justify-end items-center gap-4 pt-4 border-t border-border mt-4">
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input 
              type="checkbox" 
              checked={field.required}
              onChange={(e) => updateField(sectionId, field.id, { required: e.target.checked })}
              className="rounded bg-surface border-border text-primary focus:ring-primary"
            />
            Required
          </label>
          <button 
            onClick={() => removeField(sectionId, field.id)}
            className="text-text-muted hover:text-danger p-1 transition-colors rounded-lg hover:bg-danger/10"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Builder Component ---
const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load Form Data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await apiClient.get(`/forms/${formId}`);
        setForm(response.data);
      } catch (err) {
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId]);

  const handleSaveToServer = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`/forms/${formId}`, form);
      setLastSaved(new Date());
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save form to server');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (error || !form) return <div className="p-8 text-center text-danger">{error}</div>;

  // Handlers
  const addField = (sectionId: string) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'short_text',
      label: 'New Question',
      required: false,
      options: [],
      order_index: 999
    };
    const newSections = form.sections.map((s: any) => {
      if (s.id === sectionId) return { ...s, fields: [...s.fields, newField] };
      return s;
    });
    setForm({ ...form, sections: newSections });
  };

  const moveField = (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    const sectionIndex = form.sections.findIndex((s: any) => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const section = form.sections[sectionIndex];
    const fieldIndex = section.fields.findIndex((f: any) => f.id === fieldId);
    if (fieldIndex === -1) return;

    if (direction === 'up' && fieldIndex === 0) return;
    if (direction === 'down' && fieldIndex === section.fields.length - 1) return;

    const newFields = [...section.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    // Swap
    [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
    newFields.forEach((f: any, idx: number) => { f.order_index = idx; });

    const newSections = [...form.sections];
    newSections[sectionIndex] = { ...section, fields: newFields };
    setForm({ ...form, sections: newSections });
  };

  const updateField = (sectionId: string, fieldId: string, updates: any) => {
    const newSections = form.sections.map((s: any) => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map((f: any) => f.id === fieldId ? { ...f, ...updates } : f)
        };
      }
      return s;
    });
    setForm({ ...form, sections: newSections });
  };

  const removeField = (sectionId: string, fieldId: string) => {
    const newSections = form.sections.map((s: any) => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter((f: any) => f.id !== fieldId) };
      }
      return s;
    });
    setForm({ ...form, sections: newSections });
  };

  const removeSection = (sectionId: string) => {
    if (form.sections.length <= 1) {
      alert("You must have at least one section.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this entire section and all its questions?")) return;
    
    const newSections = form.sections.filter((s: any) => s.id !== sectionId);
    setForm({ ...form, sections: newSections });
  };

  const addSection = () => {
    const newSection = {
      id: `sec_${Date.now()}`,
      title: `Section ${form.sections.length + 1}`,
      description: '',
      order_index: form.sections.length,
      fields: []
    };
    setForm({ ...form, sections: [...form.sections, newSection] });
  };

  const getClosesAtParts = () => {
    if (!form.closes_at) return { date: '', time: '' };
    try {
      // Ensure the string is treated as UTC if backend stripped the Z
      const dtString = form.closes_at.endsWith('Z') ? form.closes_at : `${form.closes_at}Z`;
      const d = new Date(new Date(dtString).getTime() - new Date().getTimezoneOffset() * 60000).toISOString();
      return { date: d.slice(0, 10), time: d.slice(11, 16) };
    } catch {
      return { date: '', time: '' };
    }
  };
  const closesParts = getClosesAtParts();

  return (
    <div className="font-sans antialiased w-full min-h-full flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500 bg-background text-text">
      {/* Top Header */}
      <header className="flex-shrink-0 p-4 md:p-6 lg:px-10 lg:pt-8 border-b border-white/[0.05] bg-background flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 w-full xl:w-auto">
          <button onClick={() => navigate(`/clubs/${form.club_id}/forms`)} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/95 tracking-tight bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors w-full min-w-0"
            placeholder="Form Title"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 xl:gap-4 w-full xl:w-auto justify-start xl:justify-end">
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl flex-shrink-0">
            <span className={`text-xs font-bold ${form.is_published ? 'text-emerald-500' : 'text-yellow-500'}`}>
              {form.is_published ? 'ONLINE' : 'DRAFT'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.is_published || false}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <div className="w-9 h-5 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 border border-border"></div>
            </label>
          </div>


          
          <div className="text-sm text-text-muted flex items-center gap-1.5 flex-shrink-0 hidden sm:flex">
            {lastSaved && <><Check className="w-4 h-4 text-emerald-500" /> <span className="hidden md:inline">Synced</span> {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
          </div>
          
          <button 
            onClick={handleSaveToServer}
            disabled={isSaving}
            className="px-3 md:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span className="hidden sm:inline">Save to Server</span>
            <span className="sm:hidden">Save</span>
          </button>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto xl:ml-0">
            <button 
              onClick={() => navigate(`/forms/${form.id}/responses`)}
              className="px-3 md:px-4 py-2 bg-surface border border-border hover:border-emerald-500/50 text-text rounded-xl font-medium text-sm transition-colors"
            >
              Responses
            </button>
            <button 
              onClick={() => window.open(`/forms/${form.id}/view`, '_blank')}
              className="px-3 md:px-4 py-2 bg-surface border border-border hover:border-emerald-500/50 text-text rounded-xl font-medium text-sm transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-background relative min-w-0">
        
        {/* Main Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            <div className="bg-surface border-t-8 border-t-primary border border-border rounded-2xl p-6 shadow-xl relative z-10">
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-4xl font-bold bg-transparent focus:outline-none w-full mb-2 placeholder:text-text-muted"
                  placeholder="Form Title"
                />
                <textarea 
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-text-muted bg-transparent focus:outline-none w-full resize-none placeholder:text-text-muted/50"
                  placeholder="Form description..."
                  rows={2}
                />
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mt-4 pt-4 border-t border-border gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-text-muted whitespace-nowrap">CLOSES AT</span>
                    <input 
                      type="date" 
                      value={closesParts.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        if (!newDate && !closesParts.time) {
                          setForm({ ...form, closes_at: null });
                        } else {
                          const d = newDate || new Date().toISOString().slice(0, 10);
                          const t = closesParts.time || '23:59';
                          setForm({ ...form, closes_at: new Date(`${d}T${t}`).toISOString() });
                        }
                      }}
                      className="bg-surface border border-border text-sm text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                    />
                    <input 
                      type="time" 
                      value={closesParts.time}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (!newTime && !closesParts.date) {
                          setForm({ ...form, closes_at: null });
                        } else {
                          const d = closesParts.date || new Date().toISOString().slice(0, 10);
                          const t = newTime || '23:59';
                          setForm({ ...form, closes_at: new Date(`${d}T${t}`).toISOString() });
                        }
                      }}
                      className="bg-surface border border-border text-sm text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text transition-colors">
                    <input 
                      type="checkbox" 
                      checked={form.allow_edit_responses || false}
                      onChange={(e) => setForm({ ...form, allow_edit_responses: e.target.checked })}
                      className="rounded bg-surface border-border text-emerald-500 focus:ring-emerald-500"
                    />
                    Allow Respondents to Edit After Submission
                  </label>
                </div>
              </div>

              {/* Sections */}
              {form.sections.map((section: any, index: number) => (
                <div key={section.id} className="bg-surface border border-border rounded-2xl p-6 shadow-lg relative group">
                  <div className="mb-6 pb-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <input 
                        type="text" 
                        value={section.title || ''}
                        onChange={(e) => {
                          const newSections = [...form.sections];
                          newSections[index].title = e.target.value;
                          setForm({ ...form, sections: newSections });
                        }}
                        className="text-2xl font-semibold bg-transparent focus:outline-none w-full placeholder:text-text-muted"
                        placeholder="Section Title"
                      />
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-text-muted font-medium bg-background px-2 py-1 rounded whitespace-nowrap">Section {index + 1} of {form.sections.length}</span>
                        <button 
                          onClick={() => removeSection(section.id)}
                          className="text-text-muted hover:text-danger p-1 transition-colors rounded hover:bg-danger/10"
                          title="Delete Section"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={section.description || ''}
                      onChange={(e) => {
                        const newSections = [...form.sections];
                        newSections[index].description = e.target.value;
                        setForm({ ...form, sections: newSections });
                      }}
                      className="text-sm text-text-muted bg-transparent focus:outline-none w-full mt-2 placeholder:text-text-muted/50"
                      placeholder="Description (optional)"
                    />
                  </div>

                  <div className="space-y-4 min-h-[50px] relative">
                    {section.fields.map((field: any, fieldIndex: number) => (
                      <FormFieldEditor 
                        key={field.id} 
                        field={field} 
                        sectionId={section.id}
                        updateField={updateField}
                        removeField={removeField}
                        moveField={moveField}
                        sections={form.sections}
                        index={fieldIndex}
                        totalFields={section.fields.length}
                      />
                    ))}
                    
                    <div className="flex justify-center pt-2">
                      <button 
                        onClick={() => addField(section.id)}
                        className="px-4 py-2 bg-surface border border-border hover:border-primary/50 text-text rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-4">
                <button 
                  onClick={addSection}
                  className="px-6 py-3 bg-surface border-2 border-dashed border-border hover:border-primary/50 text-text-muted hover:text-primary rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
  );
};

export default FormBuilder;
