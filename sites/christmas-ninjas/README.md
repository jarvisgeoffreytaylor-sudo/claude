# The Christmas Ninjas website

Static site. Open `index.html` or serve the folder (`npx http-server`). No build step, no frameworks.
Files: `index.html`, `styles.css`, `script.js`, `assets/` (`logo.png`, `house.jpg`, `team.jpg`, `favicon.svg`), `robots.txt`, `sitemap.xml`.
Optional Google Fonts (Fredoka) is the only external request. It loads without blocking first paint (`font-display: swap`). If blocked, a metric-matched fallback (`Fredoka Fallback`, size-adjusted Arial/Helvetica) is used so the layout does not shift.

## What is real (from the client)
Business name and tagline, address (35873 Lorain Rd, North Ridgeville, OH), phone 440-320-8377, email 7Christmasninjas@gmail.com, owner Joey Wilson, the "Christmas Lighting Experts" about copy, services (holiday install, takedown, storage; permanent/semi-permanent track lighting; homes and businesses), "Cleveland Area".
Logo, house photo and team photo are cropped from a screenshot of their current site (low resolution). Replace with originals when available. Logo is unaltered on a white rounded badge because the black ninja disappears on a dark background.

## Features
- Roofline scroll progress and section nav (ninja walks the roofline, bulbs light in sequence, bulbs are links). Static with all lights on under `prefers-reduced-motion`.
- Light designer (holiday/permanent, 5 scenes, 11 color options plus a custom color picker, 6 placement zones). "Get a quote for this look" fills the quote form.
- Quote form: validates, then opens a `mailto:` to the client email with everything prefilled. Shows tap-to-call, "Open email again" and "Copy request" fallbacks.
- Glow is used only on the lights themselves (roofline, designer). Animation stops under `prefers-reduced-motion`. Without JS the header is a plain list of section links.
- Accessibility: skip link, landmarks, labelled form fields, roofline links have text names, designer works by keyboard (radios, chips, checkboxes), 44px minimum tap targets, AA contrast checked on text pairs.

## [TO CONFIRM] with the owner
- Business hours (none shown, none in JSON-LD).
- Service area detail: only "Cleveland Area" is used. Which towns/counties?
- License, insurance, bonding: nothing claimed. Add only if verified.
- Domain: no placeholder is shipped. `robots.txt` has no `Sitemap:` line and `sitemap.xml` is an empty `<urlset>` (no URLs). Once the domain is known: add `Sitemap: https://<domain>/sitemap.xml` to `robots.txt`, add `<url><loc>https://<domain>/</loc></url>` to `sitemap.xml` (or delete the file if not wanted), and add `canonical`, `og:url`, an absolute `og:image` (`assets/house.jpg` is relative now) and `url` in the JSON-LD.
- ZIP code for the address (omitted from JSON-LD, not provided).
- Whether the permanent track lighting is color-changing. The designer shows colors as a preview and says the final look is confirmed with the client. Remove colors for permanent mode if it is white-only.
- Who is in the team photo and their names/roles (caption and alt text are generic).
- Social profiles, reviews (testimonials intentionally omitted), pricing, years in business, warranties: none included.
- Better logo and photo files; a 1200x630 social share image. `assets/logo.png` is 166 KB and shown at about 240 px wide; image files were left untouched per instructions, so re-export it at about 2x display size (and optimise the JPGs) when originals arrive.

## Form backend (to do)
There is no backend. `mailto:` depends on the visitor having an email app set up. Replace with a form service (Formspree, Netlify Forms, Basin, or own endpoint) by changing the submit handler in `script.js` (`Quote` module) and keeping the call/copy fallback. Their old site used reCAPTCHA; add spam protection with any service.
