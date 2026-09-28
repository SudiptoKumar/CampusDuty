import { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';

// Convert hex color to HSL string for CSS variables
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply theme class to document and cache it
function applyTheme(theme: string): void {
  const root = document.documentElement;
  
  // Cache to localStorage for instant load on refresh
  localStorage.setItem('campus-duty-theme', theme);
  
  const updateDOM = () => {
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.remove('light');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.remove('light');
      } else {
        root.classList.add('light');
      }
    }
  };

  // Use View Transitions API for smooth crossfade if supported
  if (document.startViewTransition) {
    document.startViewTransition(updateDOM);
  } else {
    updateDOM();
  }
}

// Apply primary color to CSS variables and cache it
function applyPrimaryColor(hex: string): void {
  // Cache to localStorage for instant load on refresh
  localStorage.setItem('campus-duty-primary-color', hex);
  
  const hsl = hexToHSL(hex);
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--accent', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
  document.documentElement.style.setProperty('--sidebar-primary', hsl);
  document.documentElement.style.setProperty('--sidebar-ring', hsl);
}

/**
 * Hook that applies theme and primary color from user profile to the DOM.
 * Should be used in ProtectedRoute or AppShell to ensure settings are applied.
 */
export function useThemeApplicator() {
  const { data: profile } = useProfile();
  
  // Apply theme when profile changes
  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme);
    }
  }, [profile?.theme]);
  
  // Apply primary color when profile changes
  useEffect(() => {
    if (profile?.primary_color) {
      applyPrimaryColor(profile.primary_color);
    }
  }, [profile?.primary_color]);
  
  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (profile?.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [profile?.theme]);
}
