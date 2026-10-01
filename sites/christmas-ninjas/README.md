# Christmas Ninjas website

Static site. Open `index.html` directly or serve the folder. No build step.

Files: `index.html`, `styles.css`, `script.js`, `assets/favicon.svg`, `robots.txt`, `sitemap.xml`.

## Placeholders to fill

Search the folder for `[` to find all of them.

| Placeholder | Where | Notes |
|---|---|---|
| `[PHONE]` | index.html (hero, quote section, footer, JSON-LD, `tel:` links) | Use digits-only format in `tel:` links, e.g. `tel:+15551234567` |
| `[EMAIL]` | index.html (quote section, footer, JSON-LD, `mailto:`) | |
| `[CITY]`, `[STATE]`, `[ZIP]`, `[COUNTRY]` | title, meta, hero, FAQ, footer, JSON-LD | |
| `[STREET ADDRESS]` | footer, JSON-LD | Remove if no public address |
| `[SERVICE AREA]` | hero, FAQ, quote section, footer, JSON-LD | |
| `[HOURS]` | quote section | JSON-LD `openingHours` needs schema format, e.g. `Mo-Fr 08:00-17:00` |
| `[LICENSE # - TO BE PROVIDED]` | footer | Remove if not applicable. Do not add until verified |
| `[WEBSITE URL]` | canonical, Open Graph, JSON-LD, robots.txt, sitemap.xml | Final domain, no trailing slash |
| `[PRICE RANGE - OPTIONAL]` | JSON-LD | Delete the line if unused |
| `[FORM ENDPOINT - TO BE CONNECTED]` | quote form `action` | See below |
| `[YEAR]` | footer | Auto-replaced by JS. Fallback only |
| `[CONFIRM ...]` | FAQ, permanent lighting section | Owner must confirm: booking deadlines, who supplies lights, repair policy, pricing policy, product features |
| Gallery `[PHOTO: ...]` | gallery and permanent section | Replace with real project photos and alt text |

## Other to-dos

- **Quote form is front-end only.** It validates, then shows a "not connected" message. Hook up a backend or form service (Formspree, Netlify Forms, own endpoint), set the `action`, update `script.js`, and remove the visible "Developer note" line in `index.html`.
- **Testimonials** are intentionally omitted. Add only real, permitted reviews.
- **Assets:** add `assets/og-image.jpg` (1200x630) for social sharing. Replace the logo mark (inline SVG) if the client has a logo.
- No years in business, stats, certifications or insurance claims are included. Add only if verified.
- Test the form, links and layout again after filling placeholders.
