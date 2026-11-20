import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';

createRoot(document.getElementById('root')).render(
  <LangProvider>
    <App />
  </LangProvider>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => reg.update())
      .catch(error => console.warn('SW nie zarejestrowany:', error.message));
  });
}
