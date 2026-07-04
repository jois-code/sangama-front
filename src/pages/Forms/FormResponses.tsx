import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ArrowLeft, Users, FileText } from 'lucide-react';

const FormResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, responsesRes] = await Promise.all([
          apiClient.get(`/forms/${formId}`),
          apiClient.get(`/forms/${formId}/responses`)
        ]);
        setForm(formRes.data);
        setResponses(responsesRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load responses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (error || !form) return <div className="p-8 text-center text-danger">{error}</div>;

  // Flatten the form fields for easier lookup
  const allFields = form.sections.flatMap((s: any) => s.fields);
  const fieldMap = new Map(allFields.map((f: any) => [f.id, f]));

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/forms/${form.id}/builder`)} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold truncate max-w-sm">{form.title} - Responses</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> {responses.length} responses
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {responses.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary opacity-80" />
            </div>
            <h2 className="text-xl font-bold mb-2">Waiting for responses</h2>
            <p className="text-text-muted">Once someone fills out your form, their answers will appear here.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-background/50 border-b border-border text-text-muted text-sm">
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Submitted At</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">SRN</th>
                    <th className="p-4 font-medium">Email</th>
                    {allFields.map((field: any) => (
                      <th key={field.id} className="p-4 font-medium max-w-xs truncate" title={field.label}>
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {responses.map((response: any, idx: number) => {
                    const answerMap = new Map(response.answers.map((a: any) => [a.field_id, a.value]));
                    return (
                      <tr key={response.id} className="hover:bg-background/50 transition-colors">
                        <td className="p-4 text-text-muted">{idx + 1}</td>
                        <td className="p-4 text-text-muted">
                          {new Date(response.submitted_at?.endsWith('Z') ? response.submitted_at : response.submitted_at + 'Z').toLocaleString()}
                        </td>
                        <td className="p-4 font-medium text-white">{response.respondent?.name || 'Anonymous'}</td>
                        <td className="p-4 text-text-muted">{response.respondent?.srn || '-'}</td>
                        <td className="p-4 text-text-muted">{response.respondent?.email || '-'}</td>
                        {allFields.map((field: any) => {
                          const val = answerMap.get(field.id);
                          let displayVal = val;
                          
                          // Handle array formatting
                          if (Array.isArray(val)) {
                            // Map option IDs to text if possible
                            displayVal = val.map(v => {
                              const opt = field.options?.find((o:any) => o.id === v);
                              return opt ? opt.text : v;
                            }).join(', ');
                          } else if (field.type === 'multiple_choice') {
                            const opt = field.options?.find((o:any) => o.id === val);
                            if (opt) displayVal = opt.text;
                          }

                          return (
                            <td key={field.id} className="p-4 max-w-xs truncate" title={String(displayVal || '')}>
                              {String(displayVal || '-')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FormResponses;
