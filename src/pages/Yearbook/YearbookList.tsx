/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe2, GraduationCap, Loader2, PenLine, Search, UserRound } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { YearbookEntry } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';

type ViewLevel = 'campus' | 'year' | 'department' | 'entries';

interface CampusGroup {
  campus: string;
  count: number;
}

interface YearGroup {
  year: number;
  count: number;
}

interface DepartmentGroup {
  department: string;
  count: number;
}

const campusOrder = ['EC Campus', 'RR Campus', 'HN Campus', 'Other Campus'];

const YearbookList = () => {
  const { isAuthenticated } = useAuth();
  const [campuses, setCampuses] = useState<CampusGroup[]>([]);
  const [years, setYears] = useState<YearGroup[]>([]);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [entries, setEntries] = useState<YearbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const viewLevel: ViewLevel = selectedCampus
    ? selectedYear
      ? selectedDepartment
        ? 'entries'
        : 'department'
      : 'year'
    : 'campus';

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCampus, selectedYear, selectedDepartment]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiClient.get('/yearbook/campuses')
      .then((res) => {
        if (!isMounted) return;
        const data = (res.data as CampusGroup[]).sort((a, b) => campusSortValue(a.campus) - campusSortValue(b.campus));
        setCampuses(data);
      })
      .catch(() => {
        if (isMounted) setCampuses([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCampus) return;
    let isMounted = true;
    setLoading(true);
    setYears([]);
    setDepartments([]);
    setEntries([]);

    apiClient.get(`/yearbook/campuses/${encodeURIComponent(selectedCampus)}/years`)
      .then((res) => {
        if (isMounted) setYears(res.data);
      })
      .catch(() => {
        if (isMounted) setYears([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCampus]);

  useEffect(() => {
    if (!selectedCampus || !selectedYear) return;
    let isMounted = true;
    setLoading(true);
    setDepartments([]);
    setEntries([]);

    apiClient.get(`/yearbook/campuses/${encodeURIComponent(selectedCampus)}/years/${selectedYear}/departments`)
      .then((res) => {
        if (isMounted) setDepartments(res.data);
      })
      .catch(() => {
        if (isMounted) setDepartments([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCampus, selectedYear]);

  useEffect(() => {
    if (!selectedCampus || !selectedYear || !selectedDepartment) return;
    let isMounted = true;
    setLoading(true);
    setEntries([]);

    apiClient.get(`/yearbook/campuses/${encodeURIComponent(selectedCampus)}/years/${selectedYear}/departments/${encodeURIComponent(selectedDepartment)}/entries?skip=0&limit=60`)
      .then((res) => {
        if (isMounted) {
          const dummyEntries: YearbookEntry[] = Array.from({ length: 120 }, (_, i) => ({
            id: -1000 - i,
            quote: `This is dummy quote ${i + 1} to test the UI layout.`,
            display_name_override: `Dummy Student ${i + 1}`,
            photo_url: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
            linkedin_url: '#',
            github_url: '#',
            status: 'approved',
            campus: selectedCampus,
            graduation_year: selectedYear,
            department: selectedDepartment,
            user: {
              id: -1000 - i,
              name: `Dummy Student ${i + 1}`,
              srn: `SRN${i}`,
            }
          }));
          setEntries([...res.data, ...dummyEntries]);
        }
      })
      .catch(() => {
        if (isMounted) setEntries([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCampus, selectedDepartment, selectedYear]);

  const filteredCampuses = useMemo(() => filterGroups(campuses, query, (item) => item.campus), [campuses, query]);
  const filteredYears = useMemo(() => filterGroups(years, query, (item) => String(item.year)), [query, years]);
  const filteredDepartments = useMemo(() => filterGroups(departments, query, (item) => item.department), [departments, query]);
  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => [
      entry.display_name_override || entry.user.name,
      entry.user.name,
      entry.user.srn,
      entry.quote,
      entry.department,
      entry.campus,
      String(entry.graduation_year || ''),
    ].some((value) => value?.toLowerCase().includes(needle)));
  }, [entries, query]);

  const pageSize = 60;
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredEntries, currentPage]);

  const goBack = () => {
    if (selectedDepartment) {
      setSelectedDepartment(null);
      setEntries([]);
    } else if (selectedYear) {
      setSelectedYear(null);
      setDepartments([]);
      setEntries([]);
    } else {
      setSelectedCampus(null);
      setYears([]);
      setDepartments([]);
      setEntries([]);
    }
  };

  const reset = () => {
    setSelectedCampus(null);
    setSelectedYear(null);
    setSelectedDepartment(null);
    setYears([]);
    setDepartments([]);
    setEntries([]);
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover mb-2 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Sangama
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">Yearbook</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Browse verified senior memories by campus, graduating year, and department.
            </p>
          </div>

          <Link
            to={isAuthenticated ? '/yearbook/submit' : '/login'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <PenLine className="h-4 w-4" />
            Add My Entry
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <button
              onClick={reset}
              className={`font-semibold ${viewLevel === 'campus' ? 'text-primary' : 'hover:text-text'}`}
            >
              Campuses
            </button>
            {selectedCampus && <Breadcrumb value={selectedCampus} active={viewLevel === 'year'} />}
            {selectedYear && <Breadcrumb value={String(selectedYear)} active={viewLevel === 'department'} />}
            {selectedDepartment && <Breadcrumb value={selectedDepartment} active />}
          </div>

          <div className="grid gap-3 md:grid-cols-[auto_1fr]">
            {viewLevel !== 'campus' && (
              <button
                onClick={goBack}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this level"
                className="w-full rounded-xl border border-border bg-surface px-11 py-3 text-sm text-text outline-none transition focus:border-primary"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            Loading yearbook...
          </div>
        ) : viewLevel === 'campus' ? (
          filteredCampuses.length ? (
            <GroupGrid
              groups={filteredCampuses}
              getKey={(item) => item.campus}
              getTitle={(item) => item.campus}
              getSubtitle={(item) => `${item.count} ${item.count === 1 ? 'entry' : 'entries'}`}
              onSelect={(item) => setSelectedCampus(item.campus)}
            />
          ) : (
            <EmptyState title="No campuses yet" description="Approved entries will appear here after review." />
          )
        ) : viewLevel === 'year' ? (
          filteredYears.length ? (
            <GroupGrid
              groups={filteredYears}
              getKey={(item) => String(item.year)}
              getTitle={(item) => String(item.year)}
              getSubtitle={(item) => `${item.count} from ${selectedCampus}`}
              onSelect={(item) => setSelectedYear(item.year)}
            />
          ) : (
            <EmptyState title="No years yet" description="This campus does not have approved yearbook entries yet." />
          )
        ) : viewLevel === 'department' ? (
          filteredDepartments.length ? (
            <GroupGrid
              groups={filteredDepartments}
              getKey={(item) => item.department}
              getTitle={(item) => item.department}
              getSubtitle={(item) => `${item.count} ${item.count === 1 ? 'graduate' : 'graduates'}`}
              onSelect={(item) => setSelectedDepartment(item.department)}
            />
          ) : (
            <EmptyState title="No departments yet" description="This year does not have approved department entries yet." />
          )
        ) : filteredEntries.length ? (
          <div className="mx-auto w-full overflow-hidden rounded-[18px] border border-white/10 bg-surface/75 text-text shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="border-b border-white/10 bg-background/70 px-5 py-7 text-center md:px-10">
              <p className="font-serif text-xs uppercase tracking-[0.34em] text-primary">{selectedCampus}</p>
              <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-white md:text-3xl">
                {cleanDepartmentName(selectedDepartment)} <span className="text-text-muted">Class of</span> {selectedYear}
              </h2>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'graduate' : 'graduates'}
              </p>
            </div>

            <div className={`grid justify-center gap-x-8 gap-y-12 px-6 py-9 md:px-10 ${
              filteredEntries.length === 1
                ? 'grid-cols-1 max-w-[320px] mx-auto'
                : filteredEntries.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-[640px] mx-auto'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
              {paginatedEntries.map((entry) => (
                <YearbookCard key={entry.id} entry={entry} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-background/70 px-5 py-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text-muted"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text-muted"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="No matching quotes" description="Try a different search inside this department." />
        )}
      </main>
    </div>
  );
};

const Breadcrumb = ({ value, active }: { value: string; active?: boolean }) => (
  <>
    <span>/</span>
    <span className={active ? 'font-semibold text-primary' : 'font-semibold text-text-muted'}>{value}</span>
  </>
);

const GroupGrid = <T,>({
  groups,
  getKey,
  getTitle,
  getSubtitle,
  onSelect,
}: {
  groups: T[];
  getKey: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  onSelect: (item: T) => void;
}) => (
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {groups.map((item) => (
      <button
        key={getKey(item)}
        onClick={() => onSelect(item)}
        className="group overflow-hidden rounded-2xl border border-border bg-surface p-6 text-left transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
      >
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition group-hover:scale-105">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">{getTitle(item)}</h2>
        <p className="mt-2 text-sm font-medium text-text-muted">{getSubtitle(item)}</p>
      </button>
    ))}
  </div>
);

const YearbookCard = ({ entry }: { entry: YearbookEntry }) => {
  const displayName = entry.display_name_override || entry.user.name;
  const photo = entry.photo_url || entry.user.photo;
  const links = [
    entry.linkedin_url && { href: entry.linkedin_url, label: 'LinkedIn', type: 'linkedin' },
    entry.github_url && { href: entry.github_url, label: 'GitHub', type: 'github' },
    entry.instagram_url && { href: entry.instagram_url, label: 'Instagram', type: 'instagram' },
    entry.personal_site_url && { href: entry.personal_site_url, label: 'Website', type: 'website' },
  ].filter(Boolean) as { href: string; label: string; type: SocialType }[];

  return (
    <article className="group text-center w-full max-w-[280px] mx-auto">
      <div className="mx-auto aspect-[4/5] w-full overflow-hidden rounded-[3px] border border-white/10 bg-background p-1 shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_18px_36px_rgba(139,92,246,0.16)]">
        {photo ? (
          <img src={photo} alt={displayName} className="h-full w-full rounded-[2px] object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[2px] bg-surface-hover">
            <UserRound className="h-12 w-12 text-text-muted" />
          </div>
        )}
      </div>

      <h3 className="mx-auto mt-4 max-w-[240px] font-serif text-[18px] font-semibold leading-tight text-white">
        {displayName}
      </h3>

      <p className="mx-auto mt-2 max-w-[250px] font-serif text-[14px] italic leading-6 text-text-muted">
        "{entry.quote}"
      </p>

      {links.length > 0 && (
        <div className="mt-2 flex min-h-7 flex-wrap items-center justify-center gap-1.5">
          {links.map((link) => (
            <SocialLink key={link.type} href={link.href} label={link.label} type={link.type} />
          ))}
        </div>
      )}
    </article>
  );
};

type SocialType = 'linkedin' | 'github' | 'instagram' | 'website';
type SocialIconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const SocialLink = ({ href, label, type }: { href: string; label: string; type: SocialType }) => {
  const Icon = socialIcons[type];

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-muted transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
      title={label}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
};

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
    <path d="M6.94 8.98H3.77V20h3.17V8.98ZM7.2 5.57A1.82 1.82 0 1 0 3.56 5.56a1.82 1.82 0 0 0 3.64.01ZM20.44 13.68c0-2.96-1.58-4.33-3.7-4.33a3.2 3.2 0 0 0-2.88 1.58h-.04V8.98h-3.04V20h3.17v-5.45c0-1.44.27-2.83 2.05-2.83 1.75 0 1.77 1.64 1.77 2.92V20h3.17v-6.32h-.5Z" />
  </svg>
);

const socialIcons: Record<SocialType, React.ComponentType<SocialIconProps>> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  instagram: InstagramIcon,
  website: Globe2,
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-2xl border border-border bg-surface p-10 text-center">
    <UserRound className="mx-auto mb-4 h-10 w-10 text-text-muted" />
    <h2 className="text-xl font-bold text-white">{title}</h2>
    <p className="mt-2 text-sm text-text-muted">{description}</p>
  </div>
);

const filterGroups = <T,>(items: T[], query: string, getText: (item: T) => string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => getText(item).toLowerCase().includes(needle));
};

const campusSortValue = (campus: string) => {
  const index = campusOrder.indexOf(campus);
  return index === -1 ? campusOrder.length : index;
};

const cleanDepartmentName = (department: string | null) => {
  if (!department) return 'Department';
  return department.replace(/^branch\s*:\s*/i, '').trim();
};

export default YearbookList;
