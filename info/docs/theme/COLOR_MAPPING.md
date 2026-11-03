# Colour theme: analysis, mapping and verification

Palette supplied: Cool Grey `#A8ACAF`, Slate Blue Grey `#626F7A`, Off White `#F3F3F3`, Pure White `#FFFFFF`,
Pastel Sage Green `#8DB9A8`, Muted Indigo `#4E508F`, Coral Red `#F64B3E`, Dark Brown `#4A3837`, Soft Sand `#E8D69F`.
Text `#202126` / `#85888D` / `#A0A2A5`, borders `#E6E7E9`.
Only colours changed. No layout, spacing, type, markup, routes or behaviour changed.

## 1. What the application is

| Surface | Served by | Styling | Pages |
|---|---|---|---|
| ERP console (`:4200`) | `backend/erp-api`, `frontend/erp-console/views/*.ejs` | one stylesheet in `layout-head.ejs`, CSS variables in `:root` | Dashboard, Received Records, Citizens, Audit Trail, Portals, Sync, Integration; drawer, toasts |
| Hub dashboard (`:4100`) | `backend/platform-api`, `frontend/platform-hub/static/erp-hub.html` + `erp-hub.js` | one stylesheet, the same variables, charts drawn in JavaScript | 11 views, record pop-up, modal, toasts |
| Register, sign-in, account | `frontend/platform-hub/views/platform/_head.ejs` | its own small stylesheet and a dark-mode block | 3 pages |

Not themed: the five government portal replicas (`frontend/portals/*`), which reproduce other organisations' sites, and the
older unrouted hub pages.

## 2. Mapping

| Role | Colour |
|---|---|
| Page background `--canvas` | Off White `#F3F3F3` |
| Cards and content `--surface` | White |
| Subtle neutral surfaces `--surface-2/3` | `#F9F9F9`, `#EFF0F1` (tints of white and cool grey) |
| Sidebar and dark navigation | Slate Blue Grey `#626F7A`, white labels, a very slight lighter fill for hover and active, coral indicator bar |
| Primary actions (positive) | Pastel Sage Green `#8DB9A8` with dark text |
| Secondary actions, links, selected states, focus ring | Muted Indigo `#4E508F` |
| Highlights and important indicators | Coral Red `#F64B3E` (brand mark, active bar, brand icon tiles) |
| Subtle highlights and secondary pills | Soft Sand `#E8D69F` tint with Dark Brown `#4A3837` text |
| Chart series (portal order) | sage, indigo, coral red, dark brown, soft sand |
| Text `--text`, `--text-2`, `--text-3`, `--text-4` | `#202126`, `#5D5F63`, `#6C6E72`, `#A0A2A5` |
| Borders `--border`, `--border-strong` | `#E6E7E9`, `#D1D2D4` |

Status colours are unchanged: success green, warning amber, danger red, info blue-teal, and the red notice banners. In the
write-through charts, kept stays green, rolled back stays amber and absorbed duplicates are sage.

### Where the specified colours were adjusted for readability

| Specified | Problem | Used |
|---|---|---|
| Secondary text `#85888D` | 3.56:1 on white | `#5D5F63` for descriptions (6.4:1) and `#6C6E72` for labels and hints (5.1:1); `#85888D` is not used as text |
| Muted text `#A0A2A5` | 2.56:1 on white | decoration, disabled and scrollbar only |
| White text on sage | 2.18:1 | dark text `#202126` on sage buttons (7.4:1) |
| White text on coral red | 3.50:1 | coral is used for fills and indicators; coral text uses the derived `#BB382F` (5.0:1) |
| Lighter fill behind white sidebar text | white falls under 4.5:1 above about 6% lift | hover 5% and active 6% lift, with a thin light outline on the active item |

Derived shades (from the palette, for states only): sage hover `#7CA394`, pressed `#6E9083`, sage text `#567166`, indigo hover `#3E4072`,
indigo tint `#EDEEF4`, sage tint `#E6F0EC`, sand tint `#F7F1DD`, coral tint `#FEEDEC`, lighter coral `#F86B61`.

## 3. Files changed

* `frontend/erp-console/views/layout-head.ejs`: tokens, the styling layer, sidebar.
* `frontend/erp-console/views/dashboard.ejs`, `portals.ejs`: chart and portal series colours.
* `frontend/platform-hub/static/erp-hub.html`, `erp-hub.js`: tokens, the styling layer, sidebar, chart colours.
* `frontend/platform-hub/views/platform/_head.ejs`: register, sign-in and account pages, including dark mode.

## 4. Verification

* About 2,900 existing CSS declarations were compared with the previous version: no non-colour property changed.
* 6,666 elements on 19 pages measured with and without the styling layer: none moved or resized.
* Text contrast measured on every element: nothing below WCAG AA except the unchanged info status pill (3.93:1) and two amber-notice
  readings that are false alarms (a gradient background the check cannot read).
* 33 interaction states sampled (hover, focus, active, selected, disabled): none uses a legacy colour; keyboard focus is an indigo ring.
* No horizontal overflow at widths from 1440 down to 320 px on the console and hub pages.
* Hub functional and data-integrity checks 52/52, pop-up 32/32, change checks 11/11, failure paths 11/11, end-to-end suite 77/77, rollback test 10/10.
* The project has no build step, linter or type checker (server-rendered views and static files).

Known limits: pastel sage and soft sand are light, so chart segments and icons in those colours have low contrast against white
(about 2:1); they are always paired with a text label. The danger red and coral red are close in hue; status pills keep their own
background tint and icon to stay distinct.
