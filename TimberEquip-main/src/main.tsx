import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { applyHeadBrandAssets } from './services/brandAssetService';
import { initializePerformanceMonitoring, startPerformanceTrace } from './services/performance';
import { initializeBrowserSentry } from './services/sentry';
import { installAssetRecoveryGuards } from './utils/assetRecovery';
import './index.css';
import './styles/input-fixes.css';

installAssetRecoveryGuards();

initializeBrowserSentry();
void initializePerformanceMonitoring();
void applyHeadBrandAssets();

const appBootstrapTracePromise = startPerformanceTrace('app_bootstrap', {
  mode: import.meta.env.MODE,
  route: typeof window !== 'undefined' ? window.location.pathname : '/',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (typeof window !== 'undefined') {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      void appBootstrapTracePromise.then(async (trace) => {
        if (!trace) return;
        trace.putMetric('pathname_length', window.location.pathname.length);
        trace.putMetric('search_length', window.location.search.length);
        await trace.stop();
      });
    });
  });
}
