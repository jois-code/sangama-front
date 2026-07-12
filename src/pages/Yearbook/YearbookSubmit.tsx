import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Loader2, Save, UserRound, Globe2 } from 'lucide-react';
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
  consent_nsfw: false,
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
          consent_nsfw: false,
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
  
  const previewLinks = [
    form.linkedin_url.trim() && { href: form.linkedin_url.trim(), label: 'LinkedIn', Icon: LinkedinIcon },
    form.github_url.trim() && { href: form.github_url.trim(), label: 'GitHub', Icon: GithubIcon },
    form.instagram_url.trim() && { href: form.instagram_url.trim(), label: 'Instagram', Icon: InstagramIcon },
    form.personal_site_url.trim() && { href: form.personal_site_url.trim(), label: 'Website', Icon: Globe2 },
  ].filter(Boolean) as { href: string; label: string; Icon: React.ElementType }[];

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

          <Field label="Photo URL" hint="Compulsory, https only, accepts images and GIFs">
            <input
              value={form.photo_url}
              onChange={(event) => updateField('photo_url', event.target.value)}
              required
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

          <label className="flex gap-3 rounded-xl border border-border bg-background p-4 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={form.consent_nsfw}
              onChange={(event) => updateField('consent_nsfw', event.target.checked)}
              required
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              I confirm that I have not added any NSFW or inappropriate content. I understand that if found, my entry will be permanently removed.
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
            disabled={saving || !form.quote.trim() || !form.photo_url.trim() || !form.consent_public || !form.consent_nsfw}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save For Review
          </button>
        </form>

        <aside className="rounded-2xl border border-border bg-surface p-5 flex flex-col items-center justify-center">
          <div className="mb-6 w-full text-left text-xs font-bold uppercase tracking-widest text-text-muted">Preview</div>
          
          <article className="group text-center w-full max-w-[280px] mx-auto">
            <div className="mx-auto aspect-[4/5] w-full overflow-hidden rounded-[3px] border border-white/10 bg-background p-1 shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_18px_36px_rgba(139,92,246,0.16)]">
              {previewPhoto ? (
                <img src={previewPhoto} alt={previewName} className="h-full w-full rounded-[2px] object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[2px] bg-surface-hover">
                  <UserRound className="h-12 w-12 text-text-muted" />
                </div>
              )}
            </div>

            <h3 className="mx-auto mt-4 max-w-[240px] font-serif text-[18px] font-semibold leading-tight text-white">
              {previewName}
            </h3>

            <p className="mx-auto mt-2 max-w-[250px] font-serif text-[14px] italic leading-6 text-text-muted">
              "{form.quote.trim() || 'Your quote preview appears here.'}"
            </p>

            {previewLinks.length > 0 && (
              <div className="mt-4 flex min-h-7 flex-wrap items-center justify-center gap-2">
                {previewLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-muted transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                    title={link.label}
                    aria-label={link.label}
                  >
                    <link.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </article>
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

type SocialIconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const GithubIcon = (props: SocialIconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.31 9.31 0 0 1 12 6.98c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.91v2.82c0 .27.18.59.69.49A10.18 10.18 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
  </svg>
);

const InstagramIcon = (props: SocialIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = (props: SocialIconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default YearbookSubmit;
