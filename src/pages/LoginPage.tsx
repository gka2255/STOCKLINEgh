import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Sun, Moon, ArrowRight, ShieldAlert } from 'lucide-react';
import { INITIAL_DEMO_ACCOUNTS } from '../services/demoSeed';

interface LoginPageProps {
  onLogin: (email: string, passwordPlain: string) => Promise<void>;
  isDark: boolean;
  onToggleDark: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  isDark,
  onToggleDark,
}) => {
  const [email, setEmail] = useState(INITIAL_DEMO_ACCOUNTS[0].user.email);
  const [password, setPassword] = useState(INITIAL_DEMO_ACCOUNTS[0].passwordPlain);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your work email and password.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCredentialSelect = async (
    targetEmail: string,
    targetPassword: string
  ) => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    setError(null);
    setLoading(true);
    try {
      await onLogin(targetEmail, targetPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#181D1A] dark:bg-[#0D1310] dark:text-[#ECF2EE]">
      {/* Top Bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D] font-display text-sm font-bold text-white dark:bg-[#16A34A]">
            SL
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            StockLine Ghana
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-2 rounded-lg border border-[#D5D0C6] bg-white px-3 py-1.5 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
        >
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Light Theme</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5" />
              <span>Dark Theme</span>
            </>
          )}
        </button>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-12 lg:items-start lg:py-12">
        {/* Left Column: Email/Password Login Form */}
        <section className="rounded-lg border border-[#E4E0D8] bg-white p-6 sm:p-8 lg:col-span-7 dark:border-[#223028] dark:bg-[#131C17]">
          <div>
            <p className="text-xs font-medium text-[#14532D] dark:text-[#22C55E]">
              Restaurant Stock Control, Logistics & Requisitions
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              Sign in to StockLine
            </h1>
            <p className="mt-1.5 text-sm text-[#5C6660] dark:text-[#9AA89F]">
              Enter your assigned staff credentials. Public registration is disabled; accounts
              are provisioned by your Restaurant Manager.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]"
              >
                Work Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#8C9690]" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@stockline.gh"
                  className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] py-2.5 pl-10 pr-4 text-sm text-[#181D1A] focus:border-[#14532D] focus:bg-white focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#8C9690]" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] py-2.5 pl-10 pr-4 text-sm text-[#181D1A] focus:border-[#14532D] focus:bg-white focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-50 transition-colors dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
            >
              <span>{loading ? 'Verifying...' : 'Sign In to StockLine'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-[#E4E0D8] pt-4 text-xs text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F]">
            <span>Osu Kitchen Store · Accra, Ghana</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Currency: GH₵ (Ghanaian Cedi)</span>
          </div>
        </section>

        {/* Right Column: Quick Demo Credentials */}
        <aside className="rounded-lg border border-[#E4E0D8] bg-[#F4F1EA] p-6 lg:col-span-5 dark:border-[#223028] dark:bg-[#111915]">
          <h2 className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Demo Roles & Credentials
          </h2>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Click any account to autofill and test role-based permissions (Staff sees only My Requisitions; Storekeeper & Manager see Alerts, Movements, and Queues):
          </p>

          <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {INITIAL_DEMO_ACCOUNTS.map((entry) => {
              const { user, passwordPlain, roleDescription } = entry;
              return (
                <button
                  key={user.uid}
                  type="button"
                  onClick={() => handleQuickCredentialSelect(user.email, passwordPlain)}
                  className="w-full rounded-lg border border-[#DCD7CC] bg-white p-3 text-left transition-colors hover:border-[#14532D] dark:border-[#24332A] dark:bg-[#15201A] dark:hover:border-[#22C55E]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                      {user.name}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-medium ${
                        !user.isActive
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#14532D] dark:text-[#22C55E]'
                      }`}
                    >
                      {user.isActive ? `Role · ${user.role}` : 'Deactivated'}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                    {user.email}
                  </p>
                  <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                    {roleDescription}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3 text-[11px] text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706] dark:text-amber-400" />
            <span>
              Manager can create new staff accounts on the Users page via secondary Firebase Auth without being logged out.
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
};
