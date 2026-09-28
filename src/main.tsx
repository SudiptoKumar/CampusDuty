import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


// Disable transitions on initial load to prevent flash
document.documentElement.classList.add('no-transitions');

// Apply cached theme immediately to prevent flash
const cachedTheme = localStorage.getItem('campus-duty-theme');
const cachedPrimaryColor = localStorage.getItem('campus-duty-primary-color');

// Default to light theme (Bright) for new users
if (!cachedTheme || cachedTheme === 'light') {
  document.documentElement.classList.add('light');
} else if (cachedTheme === 'system') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!prefersDark) {
    document.documentElement.classList.add('light');
  }
}
// 'dark' requires no light class

if (cachedPrimaryColor) {
  // Convert hex to HSL and apply
  const hex = cachedPrimaryColor.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--accent', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
  document.documentElement.style.setProperty('--sidebar-primary', hsl);
  document.documentElement.style.setProperty('--sidebar-ring', hsl);
}

// Enable transitions after initial render
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions');
  });
});

createRoot(document.getElementById("root")!).render(<App />);

// Defer service worker registration to not block initial render
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisterError: () => {
          // SW registration failed silently
        },
      });
    });
  });
}
