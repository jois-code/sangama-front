import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Check, ArrowRight, ArrowLeft, Lock } from 'lucide-react';

const FormViewer = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for tracking user answers: { field_id: value }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // State for which section is currently active
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await apiClient.get(`/forms/${formId}`);
        // Ensure sections are sorted by order_index
        response.data.sections.sort((a: any, b: any) => a.order_index - b.order_index);
        response.data.sections.forEach((s: any) => {
          s.fields.sort((a: any, b: any) => a.order_index - b.order_index);
        });
        setForm(response.data);

        // Fetch my existing response if any
        try {
          const myResp = await apiClient.get(`/forms/${formId}/my_response`);
          if (myResp.data) {
            // Always show the success screen first if they already responded
            setSubmitted(true);
            
            // If editing is allowed, pre-fill the answers state so when they click "Edit", it's ready
            if (response.data.allow_edit_responses) {
              const initialAnswers: Record<string, any> = {};
              myResp.data.answers.forEach((ans: any) => {
                initialAnswers[ans.field_id] = ans.value;
              });
              setAnswers(initialAnswers);
            }
          }
        } catch (err) {
          // 404 means no response, which is fine
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load form. It may not be published.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (error || !form) return <div className="p-8 text-center text-danger">{error}</div>;

  const isClosed = form.closes_at && new Date() > new Date(form.closes_at.endsWith('Z') ? form.closes_at : form.closes_at + 'Z');

  if (isClosed) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Form Closed</h2>
        <p className="text-text-muted mb-6">This form is no longer accepting responses.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium">
          Go Back
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Response recorded</h2>
        <p className="text-text-muted mb-8">Your response has been successfully submitted to {form.title}.</p>
        <div className="flex flex-col gap-4 items-center">
          <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">
            Return to Home
          </button>
          {form.allow_edit_responses && (
            <button onClick={() => { setSubmitted(false); setCurrentSectionIndex(0); }} className="text-sm text-text-muted hover:text-text underline">
              Edit your response
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const currentSection = form.sections[currentSectionIndex];

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, optionId: string, isChecked: boolean) => {
    setAnswers(prev => {
      const current = prev[fieldId] || [];
      if (isChecked) {
        return { ...prev, [fieldId]: [...current, optionId] };
      } else {
        return { ...prev, [fieldId]: current.filter((id: string) => id !== optionId) };
      }
    });
  };

  const getNextSectionIndex = () => {
    // Check multiple choice fields in the current section for branching logic
    let overrideNextSectionId = null;
    
    for (const field of currentSection.fields) {
      if (field.type === 'multiple_choice') {
        const answeredOptionId = answers[field.id];
        if (answeredOptionId) {
          const option = field.options?.find((o: any) => o.id === answeredOptionId);
          if (option && option.next_section_id) {
            overrideNextSectionId = option.next_section_id;
            break; // take the first branching logic encountered
          }
        }
      }
    }

    if (overrideNextSectionId) {
      const index = form.sections.findIndex((s: any) => s.id === overrideNextSectionId);
      if (index !== -1) return index;
    }

    // Default: just go to the next chronological section
    return currentSectionIndex + 1;
  };

  const validateCurrentSection = () => {
    for (const field of currentSection.fields) {
      if (field.required) {
        const val = answers[field.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          alert(`"${field.label}" is a required field.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) return;
    setCurrentSectionIndex(getNextSectionIndex());
  };

  const handlePrevious = () => {
    // Basic previous logic just goes back 1 index chronologically. 
    // True reverse branching logic would require a history stack.
    setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([fieldId, value]) => ({
          field_id: fieldId,
          value: value
        }))
      };
      await apiClient.post(`/forms/${formId}/submit`, payload);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastSection = getNextSectionIndex() >= form.sections.length;

  return (
    <div className="min-h-screen bg-background text-text py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Form Header (only show on first page) */}
        {currentSectionIndex === 0 && (
          <div className="bg-surface border-t-8 border-t-primary border border-border rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl font-bold mb-4">{form.title}</h1>
            {form.description && (
              <p className="text-text-muted whitespace-pre-wrap">{form.description}</p>
            )}
          </div>
        )}

        {/* Current Section Header */}
        {(currentSection.title || currentSection.description) && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-md">
            {currentSection.title && <h2 className="text-2xl font-bold mb-2">{currentSection.title}</h2>}
            {currentSection.description && <p className="text-text-muted">{currentSection.description}</p>}
          </div>
        )}

        {/* Fields */}
        {currentSection.fields.map((field: any) => (
          <div key={field.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm focus-within:border-primary/50 transition-colors">
            <label className="block text-lg font-medium mb-4">
              {field.label} {field.required && <span className="text-danger">*</span>}
            </label>
            
            {field.type === 'short_text' && (
              <input 
                type="text"
                value={answers[field.id] || ''}
                onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                placeholder="Your answer"
                className="w-full md:w-1/2 bg-transparent border-b border-border focus:border-primary focus:outline-none py-2 transition-colors"
              />
            )}
            
            {field.type === 'paragraph' && (
              <textarea 
                value={answers[field.id] || ''}
                onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                placeholder="Your answer"
                rows={3}
                className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none py-2 transition-colors resize-none"
              />
            )}

            {field.type === 'multiple_choice' && (
              <div className="space-y-3">
                {field.options?.map((opt: any) => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name={field.id}
                      value={opt.id}
                      checked={answers[field.id] === opt.id}
                      onChange={() => handleAnswerChange(field.id, opt.id)}
                      className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                    />
                    <span className="text-text group-hover:text-primary transition-colors">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkboxes' && (
              <div className="space-y-3">
                {field.options?.map((opt: any) => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={(answers[field.id] || []).includes(opt.id)}
                      onChange={(e) => handleCheckboxChange(field.id, opt.id, e.target.checked)}
                      className="w-4 h-4 text-primary rounded bg-background border-border focus:ring-primary"
                    />
                    <span className="text-text group-hover:text-primary transition-colors">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Navigation / Submit */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {currentSectionIndex > 0 && (
              <button 
                onClick={handlePrevious}
                className="px-6 py-2.5 bg-surface border border-border hover:border-primary/50 text-text rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          <div>
            {isLastSection ? (
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                Submit <Check className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-6 py-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-secondary/20 flex items-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FormViewer;
