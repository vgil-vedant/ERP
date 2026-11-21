import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './hub.css';
import './accountmenu.css';
import { Hub } from './Hub';
import { applySavedTheme } from './accountmenu';
import './dark.css';

applySavedTheme();

createRoot(document.getElementById('root')!).render(<StrictMode><Hub /></StrictMode>);
