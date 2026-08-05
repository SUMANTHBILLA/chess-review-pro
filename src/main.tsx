import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from 'next-themes'

// Patch touch event preventDefault to silence browser intervention logs when cancelable is false
if (typeof window !== 'undefined') {
  const originalPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function (this: Event) {
    if (this.cancelable) {
      originalPreventDefault.call(this);
    }
  };
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
