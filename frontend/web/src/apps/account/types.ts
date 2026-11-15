export interface Portal { code: string; name: string; hostname: string; port: number; href: string }
export interface HeatCell { date: string; count: number; level: number; future?: boolean }
export interface Activity {
  total: number; portalsTotal: number; portalsUsed: number; confirmed: number; last: string | null;
  byPortal: { code: string; name: string; port: number; count: number; current: boolean }[];
  here: { count: number; byForm: { label: string; count: number }[] };
  heat: { weeks: number; from: string; to: string; inWindow: number; columns: HeatCell[][] };
}
export interface AccountBoot {
  site: { code: string; name: string; hostname: string };
  portals: Portal[];
  links: [string, string, string][];
  person: { fullName: string; email: string; mobile: string; personRef: string; registeredOn: string; registeredVia: string; erpCitizenRef: string | null };
  submissions: { site: string; heading: string; route: string; reference: string; erpRef: string | null; createdAt: string }[];
  activity: Activity;
  justRegistered: boolean;
}
