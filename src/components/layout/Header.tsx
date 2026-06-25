import { memo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectionStatus } from './ConnectionStatus';

export const Header = memo(function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isFavorites = location.pathname === '/favorites';

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <Link to="/" className="header-logo">
          <span className="logo-icon">◈</span>
          <h1 className="logo-text">CryptoTracker</h1>
        </Link>
      </div>

      <nav className="header-nav">
        <Link
          to="/"
          className={`nav-tab ${isHome ? 'nav-tab-active' : ''}`}
          id="nav-all"
        >
          All Markets
        </Link>
        <Link
          to="/favorites"
          className={`nav-tab ${isFavorites ? 'nav-tab-active' : ''}`}
          id="nav-favorites"
        >
          ★ Favorites
        </Link>
      </nav>

      <div className="header-right">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <ConnectionStatus />
      </div>
    </header>
  );
});
