import { useDarkMode } from '../context/DarkModeContext';

/**
 * DarkModeToggle — an animated sun/moon button wired to DarkModeContext.
 * Drop it anywhere in the layout; no props needed.
 */
export default function DarkModeToggle({ className = '' }) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      id="dark-mode-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={[
        'relative w-9 h-9 flex items-center justify-center rounded-xl',
        'text-slate-500 dark:text-slate-400',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'transition-all duration-200',
        className,
      ].join(' ')}
    >
      {/* Sun icon — visible in light mode */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon icon — visible in dark mode */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
