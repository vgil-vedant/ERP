import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './console.css';
import { readBoot } from '../../shared/boot';
import { Shell } from './Shell';
import type { ConsoleBoot } from './Shell';

createRoot(document.getElementById('root')!).render(<StrictMode><Shell boot={readBoot<ConsoleBoot>()} /></StrictMode>);
