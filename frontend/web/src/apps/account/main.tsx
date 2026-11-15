import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './account.css';
import { readBoot } from '../../shared/boot';
import { AccountPage } from './AccountPage';
import type { AccountBoot } from './types';

document.body.classList.add('ac-body');
createRoot(document.getElementById('root')!).render(<StrictMode><AccountPage boot={readBoot<AccountBoot>()} /></StrictMode>);
