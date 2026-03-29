'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('n64-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('n64-theme', newTheme);
  };

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder
    return <div style={{ width: '60px', height: '26px' }} />;
  }

  return (
    <button 
      onClick={toggleTheme} 
      style={{
        background: 'none', 
        border: '1px solid rgba(255,255,255,0.4)', 
        color: 'white', 
        padding: '4px 8px', 
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
      }}
      aria-label="Toggle Dark Mode"
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
