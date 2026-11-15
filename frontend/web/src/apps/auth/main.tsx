import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './auth.css';
import { readBoot } from '../../shared/boot';
import { AuthPage } from './AuthPage';
import type { AuthBoot } from './types';

document.body.classList.add('lg-body');
createRoot(document.getElementById('root')!).render(<StrictMode><AuthPage boot={readBoot<AuthBoot>()} /></StrictMode>);
