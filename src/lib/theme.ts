const KEY = 'theme';
export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || 'dark';
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  applyTheme(t);
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'light') root.classList.add('light');
  else root.classList.remove('light');
}

export function initTheme() {
  applyTheme(getTheme());
}
