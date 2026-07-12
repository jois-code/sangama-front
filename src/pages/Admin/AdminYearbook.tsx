/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  XCircle,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import type { YearbookEntry } from '../../api/types';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'all';

const statusOptions: ReviewStatus[] = ['pending', 'approved', 'rejected', 'all'];

const AdminYearbook = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<YearbookEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/yearbook/admin?status_filter=${statusFilter}`);
      setEntries(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 403 ? 'Access denied. Admin privileges are required.' : 'Failed to fetch yearbook entries.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const counts = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        acc[entry.status] += 1;
        acc.total += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, total: 0 }
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => {
      const displayName = entry.display_name_override || entry.user.name;
      return [
        displayName,
        entry.user.name,
        entry.user.srn,
        entry.user.branch,
        entry.user.campus,
        entry.quote,
      ].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [entries, query]);

  const updateStatus = async (entryId: number, status: Exclude<ReviewStatus, 'all'>) => {
    try {
      setUpdatingId(entryId);
      const res = await apiClient.patch(`/yearbook/admin/${entryId}/status`, { status });
      setEntries((current) => {
        if (statusFilter !== 'all' && statusFilter !== status) {
          return current.filter((entry) => entry.id !== entryId);
        }
        return current.map((entry) => (entry.id === entryId ? res.data : entry));
      });
    } catch {
      alert('Failed to update yearbook entry status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteEntry = async (entryId: number) => {
    if (!window.confirm('Delete this yearbook record permanently? This cannot be undone.')) return;

    try {
      setUpdatingId(entryId);
      await apiClient.delete(`/yearbook/admin/${entryId}`);
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
    } catch {
      alert('Failed to delete yearbook entry.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-danger" />
        <h1 className="text-2xl font-bold text-danger">Review Console Locked</h1>
        <p className="text-text-muted">{error}</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 rounded-xl border border-border px-4 py-2 transition-colors hover:bg-white/5"
        >
          Return to Admin Hub
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-surface/50 shadow-2xl">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-primary/20 blur-[90px]" />
          <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-secondary/10 blur-[80px]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="mt-1 rounded-xl border border-border bg-background/70 p-2 text-text-muted transition hover:border-primary hover:text-primary"
                title="Back to admin"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Yearbook Review
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Graduation Wall Curation</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                  Review senior quotes, public consent, photos, and links before they become visible on the public yearbook.
                </p>
              </div>
            </div>

            <button
              onClick={fetchEntries}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-4">
            <Metric label="In View" value={counts.total} tone="primary" />
            <Metric label="Pending" value={counts.pending} tone="warning" />
            <Metric label="Approved" value={counts.approved} tone="success" />
            <Metric label="Rejected" value={counts.rejected} tone="danger" />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SRN, branch, campus, or quote"
            className="w-full rounded-2xl border border-border bg-surface px-11 py-3 text-sm text-text outline-none transition focus:border-primary"
          />
        </label>

        <div className="flex overflow-hidden rounded-2xl border border-border bg-surface p-1">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-muted hover:bg-white/5 hover:text-text'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border bg-surface text-text-muted">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          Loading review queue...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-border bg-surface p-8 text-center">
          <GraduationCap className="mb-4 h-12 w-12 text-text-muted" />
          <h2 className="text-2xl font-black text-white">Nothing to review</h2>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            The selected queue is empty. When seniors submit entries, their cards will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredEntries.map((entry) => (
            <ReviewCard
              key={entry.id}
              entry={entry}
              isUpdating={updatingId === entry.id}
              onApprove={() => updateStatus(entry.id, 'approved')}
              onReject={() => updateStatus(entry.id, 'rejected')}
              onReset={() => updateStatus(entry.id, 'pending')}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'warning' | 'success' | 'danger' }) => {
  const toneClass = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    success: 'text-success bg-success/10 border-success/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
};

const ReviewCard = ({
  entry,
  isUpdating,
  onApprove,
  onReject,
  onReset,
  onDelete,
}: {
  entry: YearbookEntry;
  isUpdating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onReset: () => void;
  onDelete: () => void;
}) => {
  const displayName = entry.display_name_override || entry.user.name;
  const photo = entry.photo_url || entry.user.photo;
  const profileMeta = [entry.user.branch, entry.user.campus].filter(Boolean).join(' / ');

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative min-h-[260px] bg-background">
          {photo ? (
            <img src={photo} alt={displayName} className="h-full min-h-[260px] w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center">
              <UserRound className="h-16 w-16 text-text-muted" />
            </div>
          )}
          <div className="absolute left-4 top-4">
            <StatusPill status={entry.status} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col p-5">
          <div className="mb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black text-white">{displayName}</h2>
                {entry.display_name_override && (
                  <p className="mt-1 text-xs text-text-muted">Official: {entry.user.name}</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-2 text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">SRN</div>
                <div className="text-xs font-bold text-white">{entry.user.srn}</div>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">
              {profileMeta || entry.user.program || 'Profile details unavailable'}
            </p>
          </div>

          <blockquote className="mb-5 rounded-2xl border border-white/10 bg-background/70 p-4 text-sm leading-7 text-text">
            "{entry.quote}"
          </blockquote>

          <div className="mb-5 flex flex-wrap gap-2">
            <SocialChip href={entry.linkedin_url} label="LinkedIn" />
            <SocialChip href={entry.github_url} label="GitHub" />
            <SocialChip href={entry.instagram_url} label="Instagram" />
            <SocialChip href={entry.personal_site_url} label="Website" />
            {entry.photo_url && <SocialChip href={entry.photo_url} label="Photo" />}
          </div>

          <div className="mt-auto grid gap-2 sm:grid-cols-4">
            <button
              onClick={onApprove}
              disabled={isUpdating || entry.status === 'approved'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-bold text-success transition hover:bg-success hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isUpdating || entry.status === 'rejected'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm font-bold text-danger transition hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject
            </button>
            <button
              onClick={onReset}
              disabled={isUpdating || entry.status === 'pending'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pending
            </button>
            <button
              onClick={onDelete}
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/30 px-4 py-3 text-sm font-bold text-danger transition hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const StatusPill = ({ status }: { status: YearbookEntry['status'] }) => {
  const className = {
    pending: 'border-warning/30 bg-warning/20 text-warning',
    approved: 'border-success/30 bg-success/20 text-success',
    rejected: 'border-danger/30 bg-danger/20 text-danger',
  }[status];

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest backdrop-blur ${className}`}>
      {status}
    </span>
  );
};

const SocialChip = ({ href, label }: { href?: string | null; label: string }) => {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:border-primary hover:text-primary"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
};

export default AdminYearbook;
