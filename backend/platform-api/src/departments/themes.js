'use strict';

/**
 * Each department office takes the look of its own portal: the colours, type
 * and corners sampled from the replicated home pages, and the portal's logo.
 */

const THEMES = {
  eprisons: {
    primary: '#0D4F86', dark: '#093A63', accent: '#4FA3D9', soft: '#E8F1F8', canvas: '#F3F6F9',
    font: 'Arial, Helvetica, sans-serif', heading: 'Arial, Helvetica, sans-serif', radius: '6px',
    logo: 'images/eprisons_logo.png', tagline: 'National Prisons Information Portal',
    logoUrl: '/office/assets/img/npip-logo.png',   // the portal's own header logo
    skin: 'eprisons',   // dark utility bar of pills, white header, coloured tiles of the portal (office-eprisons.css)
  },
  cctns: {
    primary: '#0062CC', dark: '#05153A', accent: '#3B8CE6', soft: '#E7F0FB', canvas: '#F2F5F9',
    font: 'Tahoma, Geneva, Verdana, sans-serif', heading: 'Tahoma, Geneva, Verdana, sans-serif', radius: '4px',
    logo: 'images/cctnsLogoNew.png', tagline: 'Crime and Criminal Tracking Network and Systems',
    logoUrl: '/static/img/cctns-mark.svg',   // the portal's neutral demonstration mark (no emblem, no crest)
    skin: 'cctns',   // navy header, icon navigation bar and split-screen sign-in of the portal (office-cctns.css)
  },
  eforensics: {
    primary: '#6D3FE6', dark: '#00143C', accent: '#7887F3', soft: '#F0ECFD', canvas: '#F5F4FB',
    font: "'Segoe UI', Arial, Helvetica, sans-serif", heading: "Georgia, 'Times New Roman', serif", radius: '10px',
    logo: 'images/logo.png', tagline: 'e-Forensic 2.0 · Forensic Science Laboratories',
    skin: 'eforensics',   // navy header, purple stage and white panels of the portal (office-eforensics.css)
  },
  uidai: {
    primary: '#2F2B69', dark: '#191636', accent: '#E26A2C', soft: '#EEEDF9', canvas: '#F6F6FB',
    font: "'Noto Sans', 'Segoe UI', system-ui, Arial, sans-serif", heading: "'Noto Sans', 'Segoe UI', system-ui, Arial, sans-serif", radius: '10px',
    logo: 'icons/logoWithTitle.svg', tagline: 'Unique Identification Authority of India',
    skin: 'uidai',   // the office wears the portal's own header, navigation bar and cards (office-uidai.css)
  },
  ecourts: {
    primary: '#105B59', dark: '#102B35', accent: '#2B8C88', soft: '#E3F2F1', canvas: '#F3F7F8',
    font: "Inter, Roboto, 'Noto Sans', system-ui, Arial, sans-serif", heading: "Inter, Roboto, 'Noto Sans', system-ui, Arial, sans-serif", radius: '8px',
    logo: 'images/ecourts-logo.png', tagline: 'eCourts Services · District Courts',
    logoUrl: '/static/img/ecourts-sso-logo.png', sealUrl: '/static/img/ecourts-seal.png',   // the portal's own branding images
    skin: 'ecourts',   // white utility bar, teal navigation and light-blue title band of the portal (office-ecourts.css)
  },
};

/** The theme as CSS custom properties for the page's <style>. */
function cssVars(code) {
  const t = THEMES[code];
  return `--o-primary:${t.primary};--o-dark:${t.dark};--o-accent:${t.accent};--o-soft:${t.soft};--o-canvas:${t.canvas};`
    + `--o-font:${t.font};--o-heading:${t.heading};--o-radius:${t.radius};`;
}

module.exports = { THEMES, cssVars };
