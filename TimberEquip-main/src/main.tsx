import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { applyHeadBrandAssets } from './services/brandAssetService';
import './index.css';
import './styles/input-fixes.css';

void applyHeadBrandAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
