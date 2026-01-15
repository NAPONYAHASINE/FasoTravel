
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline ticket serving
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Registration successful
      console.log('Service worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
  