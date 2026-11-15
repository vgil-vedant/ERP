export interface PortalChip { name: string; href?: string; here?: boolean }
export interface FieldDef {
  id: string; name: string; label: string; icon: 'user' | 'mail' | 'lock' | 'phone'; type?: string; password?: boolean;
  required?: boolean; maxLength?: number; autoComplete?: string; inputMode?: 'numeric'; autoFocus?: boolean; empty?: string;
}
export interface AuthBoot {
  page: 'login' | 'register' | 'hub-login';
  action: string;             // where the form posts (the same URL the EJS page posts to)
  next: string | null;
  values: Record<string, string>;
  errors: Record<string, string>;   // per-field messages from the server
  serverError: string;         // single message under the fields (wrong password, too many attempts)
  fatal: string;               // registration rolled back
  footer: string;
  portals: PortalChip[];
  altHref: string;             // "Create account" / "Sign in" link target
}
