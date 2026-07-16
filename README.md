# Galim Health — Shopify Theme (OS 2.0)

Dark, futuristic, clinical marketing theme for **Galim Health** (preventive healthcare / longevity, Monterrey MX). Built on Dawn so the existing store infrastructure — cart, checkout, customer accounts and the `collections/all` catalog — keeps working. The redesigned homepage is assembled from custom, fully editable `galim-*` sections.

> Dawn's original README is preserved as `DAWN_README.md`.

---

## Requirements

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) (`shopify`)
- Node.js (the CLI needs it; if `shopify theme dev` says `env: node: No such file or directory`, reinstall Node: `brew install node`)
- A Shopify store you can log into

## Run locally

```bash
cd galim2
shopify theme dev --store your-store.myshopify.com
```

This serves the theme with hot reload at `http://127.0.0.1:9292`. Log in when prompted.

Other useful commands:

```bash
shopify theme check          # linting — must pass with no errors
shopify theme push           # push to a theme on the store (use --unpublished for a draft)
shopify theme pull           # pull the live theme’s JSON settings back down
```

The repo is also GitHub-connected, so you can attach it to the store via **Online Store → Themes → Add theme → Connect from GitHub**.

---

## Where to drop assets

All brand assets live in `assets/`. They ship with the theme, but you can replace them:

| Asset | File in `assets/` | Used by |
|---|---|---|
| Logo (white, dark bg) | `logo_galimhealth_white.png` | Header, Footer |
| Logo (teal, light bg) | `logo_galimhealth.png` | spare |
| Logo (black) | `logo_galimhealth_black.png` | spare |
| Fustat fonts (5 weights) | `Fustat-ExtraLight/Light/Regular/Medium/SemiBold.ttf` | loaded via `@font-face` in `layout/theme.liquid` |

**Fonts** are self-hosted; JetBrains Mono is pulled from Google Fonts. To swap a font weight, replace the `.ttf` and keep the filename (or update the `@font-face` block in `layout/theme.liquid`).

**Hero image** — the mock references the live CDN image. In the theme it’s a customizer setting:
- Preferred: **Galim · Hero → Hero image** (upload the final art in the theme editor).
- Fallback: **…or image URL** (defaults to the current `galimhealth.com` CDN image). If neither loads, a dark panel shows.

---

## What’s editable in the customizer

Everything content-related is exposed through section `{% schema %}` settings — nothing is hardcoded. Open **Online Store → Themes → Customize**.

### Global (Theme settings)
- **Galim · Waitlist modal** — all modal copy (title, subtitle, field labels, the three “¿Qué te interesa más?” options, submit label, success message) and an optional **external form endpoint**. Leave the endpoint blank to use Shopify’s native customer/newsletter form (subscribers are tagged `waitlist` + their interest, so you can filter them in **Customers**).

### Header & Footer (shown on every page)
- **Galim · Announcement** — text, ◈ glyph toggle, background & text colors.
- **Galim · Header** — logo + height, menu (`link_list`), Log in label/URL, Join Waitlist label. Mobile shows a hamburger → drawer with the same links.
- **Galim · Footer** — logo, tagline, two menus (Navigate / Legal), payment note, copyright, bottom-right text.

### Homepage sections (`templates/index.json`)
1. **Galim · Hero** — image, badge, headline, subheadline, council line, button (opens the waitlist modal or a custom link), coordinates line.
2. **Galim · The Gap** — eyebrow, green check chip, rich-text headline (**bold = highlighted words**), body, background color.
3. **Galim · Two Axes** — eyebrow + BQ panel copy; **Axis cards** and **BQ tier rows** are repeatable blocks (add/remove/reorder, per-row colors, highlight toggle).
4. **Galim · Protocols** — heading + GLP-1 note; each **Package** is a block (icon, name, scan time, tagline, price, features list, add-ons line, “Featured” toggle → green border + badge). No booking button by design.
5. **Galim · Advanced Diagnostics** — heading/subheading; each **Add-on row** is a block (icon, name, description, optional link). Numbers auto-count 01–05.
6. **Galim · Method** — eyebrow, rich-text headline (bold = highlight), two paragraphs, outline button.
7. **Galim · Final CTA** — eyebrow, headline (line break + `<strong>` for the bold line), button (opens modal), note.

Each section can be reordered, hidden, or duplicated from the editor. Backgrounds for the content bands are color settings so the alternating rhythm stays adjustable.

---

## Waitlist form

The CTA buttons in the header, hero and final CTA all open one shared modal (`snippets/galim-waitlist-modal.liquid`), with a name field, email, and the optional “¿Qué te interesa más?” select.

- **Default (recommended):** Shopify’s native `{% form 'customer' %}` — no external service. New signups appear under **Customers**, tagged `waitlist` and their chosen interest.
- **Custom endpoint:** set **Theme settings → Galim · Waitlist modal → External form endpoint** to POST to a third-party form instead (fields: `name`, `email`, `interest`).

---

## Architecture notes

- One responsive theme — the same markup collapses from desktop to mobile at **768px** (no separate mobile theme).
- Global tokens (palette, keyframes, buttons) live in `assets/galim.css`; each section carries its own scoped CSS in a `{% stylesheet %}` block.
- Icons are inline stroke SVGs in `snippets/icon-*.liquid`, colored with `currentColor`.
- Interactions (mobile drawer, waitlist modal, sticky-header condense) are in `assets/galim.js`.
- Built on Dawn: standard templates (product, collection, cart, search, customer accounts, 404, etc.) are unchanged and continue to work.

## Custom files added on top of Dawn

```
assets/galim.css                    global tokens, buttons, keyframes
assets/galim.js                     drawer, waitlist modal, sticky header
assets/Fustat-*.ttf                 brand font (5 weights)
assets/logo_galimhealth*.png        logos

sections/galim-announcement.liquid  ┐
sections/galim-header.liquid        ┘ header-group.json
sections/galim-hero.liquid          ┐
sections/galim-gap.liquid           │
sections/galim-two-axes.liquid      │
sections/galim-protocols.liquid     │ templates/index.json
sections/galim-diagnostics.liquid   │
sections/galim-method.liquid        │
sections/galim-final-cta.liquid     ┘
sections/galim-footer.liquid        ← footer-group.json

snippets/galim-waitlist-modal.liquid
snippets/icon-{bolt,infinity,dna,mri,blood,heartbeat,microbiome}.liquid
```
