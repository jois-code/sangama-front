import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Cake, Gift, ArrowLeft, UserRound } from 'lucide-react';
import { apiClient } from '../../api/client';

interface BirthdayUser {
  id: number;
  name: string;
  srn: string;
  photo: string | null;
  branch: string | null;
  campus: string | null;
  date_of_birth: string | null;
}

const BirthdayList = () => {
  const [users, setUsers] = useState<BirthdayUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/birthdays/today')
      .then((res) => {
        if (isMounted) {
          setUsers(res.data);
        }
      })
      .catch(() => {
        if (isMounted) setUsers([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-text overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 40 + 10}px`,
              height: `${Math.random() * 40 + 10}px`,
              backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
              animationDuration: `${Math.random() * 5 + 5}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <header className="relative z-10 border-b border-border bg-surface/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover mb-4 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Sangama
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl flex items-center gap-4">
              <Cake className="h-10 w-10 text-pink-500 animate-bounce" />
              Today's Birthdays
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Join us in wishing a very happy birthday to these amazing people!
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-12">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            Finding birthday stars...
          </div>
        ) : users.length > 0 ? (
          <div className="grid justify-center gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.map(user => (
              <BirthdayCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface/80 p-12 text-center backdrop-blur-md max-w-2xl mx-auto mt-12 shadow-2xl">
            <Gift className="mx-auto mb-6 h-16 w-16 text-text-muted opacity-50" />
            <h2 className="text-2xl font-bold text-white">No Birthdays Today</h2>
            <p className="mt-3 text-text-muted">It seems no one is celebrating a birthday today. Check back tomorrow!</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

const BirthdayCard = ({ user }: { user: BirthdayUser }) => {
  return (
    <article className="group text-center w-full max-w-[280px] mx-auto transform transition-all duration-500 hover:scale-105 hover:-translate-y-2">
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-4 border-pink-500/50 bg-background p-1 shadow-[0_0_30px_rgba(236,72,153,0.3)] transition duration-300 group-hover:border-pink-500 group-hover:shadow-[0_0_50px_rgba(236,72,153,0.6)]">
        {user.photo ? (
          <img src={user.photo} alt={user.name} className="h-full w-full rounded-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-hover">
            <UserRound className="h-20 w-20 text-text-muted" />
          </div>
        )}
        
        <div className="absolute -bottom-1 -right-1 text-5xl animate-pulse drop-shadow-xl" style={{ animationDuration: '2s' }}>🎉</div>
      </div>

      <h3 className="mx-auto mt-6 max-w-[240px] font-sans text-2xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
        {user.name}
      </h3>

      <p className="mx-auto mt-2 max-w-[250px] text-sm font-semibold text-text-muted">
        {user.branch || 'Student'}
      </p>
      <p className="mx-auto mt-1 max-w-[250px] text-xs font-medium text-text-muted/70 uppercase tracking-widest">
        {user.campus || 'PESU'}
      </p>
    </article>
  );
};

export default BirthdayList;
