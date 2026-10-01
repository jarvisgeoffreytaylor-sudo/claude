# The Christmas Ninjas website

Static site. Open `index.html` or serve the folder (`npx http-server`). No build step, no frameworks.
Files: `index.html`, `styles.css`, `script.js`, `assets/` (`logo.png`, `house.jpg`, `team.jpg`, `favicon.svg`), `robots.txt`, `sitemap.xml`.
Optional Google Fonts (Jost, Inter) are the only external request. They load without blocking first paint (`font-display: swap`). If blocked, system fallbacks are used.

## What is real (from the client)
Business name and tagline, address (35873 Lorain Rd, North Ridgeville, OH), phone 440-320-8377, email 7Christmasninjas@gmail.com, owner Joey Wilson, the "Christmas Lighting Experts" about copy, services (holiday install, takedown, storage; permanent/semi-permanent track lighting; homes and businesses), "Cleveland Area".
Logo, house photo and team photo are cropped from a screenshot of their current site (low resolution). Replace with originals when available. Logo is unaltered on a square white plate because the black ninja disappears on a dark background.

## Design (v2, minimalist)
Mostly black, lit only by its own lights. Jost (light display, tracked caps labels) + Inter (body) from Google Fonts with real fallbacks (Avenir Next, Century Gothic, system-ui). Hairline rules, 2px radii, no pills. One red (from the logo) for the primary button and tiny rules; green appears only inside the light designer. Cartoon lives only in the logo and the ninja silhouette. Logo is unaltered on a square white plate (header and footer).

## Features
- Hero: full-viewport inline SVG of the house roofline, hand-traced from `assets/house.jpg` (gables, dormer, garage-side roof, right wing; trace coordinates are in photo pixel space, 994 x 522). A bulb string follows the real roof edges. A small ninja (after the logo's ninja) crouches in the dark next to one dim pilot bulb. Under JS the roof is pinned for about 2 extra screens of scroll: scrolling, swiping/dragging, tapping or the arrow keys move him along the roof and bulbs switch on behind him; at the end the full roofline is lit. On narrow or tall screens the view follows him.
- Nothing is gated: header nav, Call and Get a quote are visible at once; "Turn on all lights" button (becomes "Replay"), skip link and any in-page link jump past the animation. The hero scene is a keyboard slider (Left/Right/Home/End). Position is simply scroll position, so there is no scroll hijacking.
- No JS or `prefers-reduced-motion`: no runway, fully lit static hero, ninja on the middle peak, scroll reveals off.
- Fixed minimal header (logo, Services/Designer/About/Contact, Call). Menu button on small screens (plain wrapping links without JS).
- Light designer: thin-line house, text toggles, square swatches, 6 zones plus custom color, live glow, aria-live summary, "Get a quote for this look" fills the form.
- Quote form: underline inputs, validates, opens a `mailto:` to the client email with everything prefilled. Tap-to-call, "Open email again" and "Copy request" fallbacks.
- Team photo shown dark, desaturated, with a vignette (CSS only; the file is untouched).
- Accessibility: skip link, landmarks, visible focus, 44px targets, AA contrast on text, labelled fields.

## Editing the hero
Light strings are the `<path id="s1..s8">` elements inside `#roof` in `index.html`; each `<g class="str" data-u="a,b">` lights while the ninja walks route vertices a to b. The route vertices (`RV`) are at the top of the `Hero` module in `script.js`. Ninja artwork is `#nj` / `#ninja-sym` in the same SVG (also reused in the designer).

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
