import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

const NEWS_CATS = [
  { id: 'technology', label: '💻 Technology' },
  { id: 'science', label: '🔬 Science' },
  { id: 'business', label: '📈 Business' },
  { id: 'health', label: '🏥 Health' },
  { id: 'sports', label: '⚽ Sports' },
  { id: 'entertainment', label: '🎬 Entertainment' },
  { id: 'general', label: '🌐 General' },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = account details, 2 = preferences
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '',
    preferred_unit: 'C',
    preferred_news_categories: ['technology', 'general'],
    default_city: 'London',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCat = (cat) => {
    setForm((f) => {
      const cats = f.preferred_news_categories;
      return {
        ...f,
        preferred_news_categories: cats.includes(cat)
          ? cats.filter((c) => c !== cat)
          : [...cats, cat],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Register
      await api.post('/auth/register/', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      // 2. Login to get tokens
      await login(form.email.trim().toLowerCase(), form.password);
      // 3. Save preferences
      await api.patch('/auth/preferences/', {
        preferred_unit: form.preferred_unit,
        preferred_news_categories: form.preferred_news_categories,
        default_city: form.default_city.trim() || 'London',
      });
      navigate('/dashboard');
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail
        || data?.email?.[0]
        || data?.password?.[0]
        || 'Registration failed. Please try again.';
      setError(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Helmet>
        <title>Create Account · PulseBoard</title>
        <meta name="description" content="Create your PulseBoard account and start tracking weather and news in one place." />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          PulseBoard
        </span>
        <DarkModeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s === step ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40'
                    : s < step ? 'bg-indigo-500/30 text-indigo-300'
                    : 'bg-white/10 text-slate-500'
                  }`}>{s}</div>
                  {s === 1 && <div className="flex-1 h-px bg-white/10 w-8" />}
                </div>
              ))}
              <span className="ml-1 text-xs text-slate-400">
                {step === 1 ? 'Account details' : 'Your preferences'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? 'Create your account' : 'Personalise PulseBoard'}
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              {step === 1
                ? 'Fill in your details to get started.'
                : 'Choose your defaults — you can change these any time.'}
            </p>

            {error && (
              <div id="register-error" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form id="register-form" onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">

              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[['first_name', 'First name', 'text'], ['last_name', 'Last name', 'text']].map(([k, lbl]) => (
                      <div key={k}>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">{lbl}</label>
                        <input
                          id={`reg-${k}`}
                          type="text"
                          value={form[k]}
                          onChange={set(k)}
                          required
                          placeholder={lbl}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                    <input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        required
                        minLength={8}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label={showPass ? 'Hide password' : 'Show password'}>
                        {showPass
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200">
                    Continue →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Temperature unit */}
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-2">Temperature unit</p>
                    <div className="flex gap-3">
                      {[['C', '°C Celsius'], ['F', '°F Fahrenheit']].map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, preferred_unit: val }))}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            form.preferred_unit === val
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default city */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Default city</label>
                    <input
                      id="reg-city"
                      type="text"
                      value={form.default_city}
                      onChange={set('default_city')}
                      placeholder="London"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* News categories */}
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-2">News categories you care about</p>
                    <div className="flex flex-wrap gap-2">
                      {NEWS_CATS.map(({ id, label }) => {
                        const active = form.preferred_news_categories.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleCat(id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors">
                      ← Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60">
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
