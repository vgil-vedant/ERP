import { ICON_PATHS } from './iconPaths';

export type IconName = keyof typeof ICON_PATHS | string;

// Same icon markup as the current pages (lucide-style, 24x24, 1.8 stroke).
export function Icon({ n }: { n: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[n] ?? '' }} />
  );
}
