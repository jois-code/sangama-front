import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Loader2, Save, UserRound } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { YearbookEntry } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';

const emptyForm = {
  quote: '',
  display_name_override: '',
  photo_url: '',
  linkedin_url: '',
  github_url: '',
  instagram_url: '',
  personal_site_url: '',
  consent_public: false,
};

const YearbookSubmit = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [existingEntry, setExistingEntry] = useState<YearbookEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiClient.get('/yearbook/me')
      .then((res) => {
        if (!isMounted || !res.data) return;
        const entry = res.data as YearbookEntry;
        setExistingEntry(entry);
        setForm({
          quote: entry.quote || '',
          display_name_override: entry.display_name_override || '',
          photo_url: entry.photo_url || '',
          linkedin_url: entry.linkedin_url || '',
          github_url: entry.github_url || '',
          instagram_url: entry.instagram_url || '',
          personal_site_url: entry.personal_site_url || '',
          consent_public: true,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (field: keyof typeof emptyForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        display_name_override: form.display_name_override.trim() || null,
        photo_url: form.photo_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        github_url: form.github_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        personal_site_url: form.personal_site_url.trim() || null,
      };

      const res = await apiClient.put('/yearbook/me', payload);
      setExistingEntry(res.data);
      setMessage('Saved. Your entry is pending review before it appears publicly.');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save your yearbook entry.');
    } finally {
      setSaving(false);
    }
  };

  const previewName = form.display_name_override.trim() || user?.name || 'Your Name';
  const previewPhoto = form.photo_url.trim() || user?.photo;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
        Loading yearbook form...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Yearbook Entry</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Your identity details come from Sangama. Add only the quote, display style, links, and photo URL you want public.
          </p>
        </div>
        <Link
          to="/yearbook"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" />
          View Public Page
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-surface p-5">
          {existingEntry && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              Current status: <span className="font-bold capitalize">{existingEntry.status}</span>
            </div>
          )}

          <Field label="Quote" hint={`${form.quote.length}/300`}>
            <textarea
              value={form.quote}
              onChange={(event) => updateField('quote', event.target.value)}
              maxLength={300}
              required
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              placeholder="Leave one line your juniors will remember."
            />
          </Field>

          <Field label="Display name override" hint="Optional">
            <input
              value={form.display_name_override}
              onChange={(event) => updateField('display_name_override', event.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              placeholder={user?.name || 'Your official name is used by default'}
            />
          </Field>

          <Field label="Photo URL" hint="Optional, https only">
            <input
              value={form.photo_url}
              onChange={(event) => updateField('photo_url', event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              placeholder="https://..."
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <UrlInput label="LinkedIn" value={form.linkedin_url} onChange={(value) => updateField('linkedin_url', value)} />
            <UrlInput label="GitHub" value={form.github_url} onChange={(value) => updateField('github_url', value)} />
            <UrlInput label="Instagram" value={form.instagram_url} onChange={(value) => updateField('instagram_url', value)} />
            <UrlInput label="Personal site" value={form.personal_site_url} onChange={(value) => updateField('personal_site_url', value)} />
          </div>

          <label className="flex gap-3 rounded-xl border border-border bg-background p-4 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={form.consent_public}
              onChange={(event) => updateField('consent_public', event.target.checked)}
              required
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              I consent to publish this yearbook entry publicly, including my Sangama profile details used on the card.
            </span>
          </label>

          {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !form.quote.trim() || !form.consent_public}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save For Review
          </button>
        </form>

        <aside className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">Preview</div>
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <div className="flex gap-4 p-5">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-surface">
                {previewPhoto ? (
                  <img src={previewPhoto} alt={previewName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-8 w-8 text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-white">{previewName}</h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
                  {[user?.branch, user?.campus].filter(Boolean).join(' / ') || user?.srn}
                </p>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                  "{form.quote.trim() || 'Your quote preview appears here.'}"
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-white">{label}</span>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </div>
    {children}
  </label>
);

const UrlInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <Field label={label} hint="https only">
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
      placeholder="https://..."
    />
  </Field>
);

export default YearbookSubmit;
