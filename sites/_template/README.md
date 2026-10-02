# Client site template (HVAC / trades)

Plain HTML + CSS, no build step. Rugged dark/accent design. Sections: header, hero, services, how it works, service area, contact, footer, sticky mobile call bar, LocalBusiness JSON-LD.

## Start a new client

```sh
cp -r sites/_template sites/<client-name>
cd sites/<client-name>
# replace every token, e.g.:
sed -i 's|{{BUSINESS_NAME}}|Acme Heating \& Cooling|g' index.html
# list what is still unfilled:
grep -rno --exclude=README.md '{{[A-Z0-9_]*}}' .
```

Add `-h | sort -u` for a unique token list. Tokens inside the commented-out optional blocks also show up. Delete any optional block you are not using so the list ends at zero. In `sed`, escape `&` as `\&` and use a different delimiter than `/` for URLs.

## Tokens

| Token | Meaning | Example |
|-------|---------|---------|
| `BUSINESS_NAME` | Full legal/trade name | Acme Heating & Cooling |
| `BRAND_LINE_1` / `BRAND_LINE_2` | Header wordmark, caps line + italic line | ACME HVAC / Heating & Cooling |
| `PHONE_DISPLAY` | Phone as shown | (555) 123-4567 |
| `PHONE_E164` | Phone for `tel:` and JSON-LD | +15551234567 |
| `CITY`, `STATE` | Home base | Springfield, OH |
| `TAGLINE` | One plain sentence under the headline | |
| `HERO_HEADLINE` / `HERO_ACCENT` | Big headline; second part shows in accent color | Furnace out? / Call us. |
| `CONTACT_NOTE` | Short line under phone (only claim what is true) | Call or message anytime. |
| `TITLE_SERVICES`, `META_SERVICES` | Title tag and meta description service text | AC Repair & Furnace Installation |
| `SERVICE_n_NAME / _DESCRIPTION / _CTA / _PHOTO_NOTE` | Service blocks 1-3. Copy or delete `<article class="service">` blocks | |
| `OTHER_WORK_HEADING` / `OTHER_WORK_TEXT` | "Other work?" callout. Delete the `<p class="other">` if not wanted | |
| `SERVICE_AREA` / `SERVICE_AREA_NOTE` | Towns/counties served, and a short note | |
| `SOCIAL_URL` / `SOCIAL_LABEL` | Facebook (or other) page URL and its name | https://facebook.com/... / Facebook |
| `DOMAIN` | No `https://`, no trailing slash | acmehvac.com |
| `HERO_PHOTO_NOTE` | Placeholder caption, also used in `images/README.md` | |
| `ACCENT_COLOR`, `ACCENT_DARK_COLOR`, `SECONDARY_COLOR` | In `styles.css` `:root`. Accent = bright brand color; dark = same hue, 4.5:1+ on white for text; secondary = border above service area | #e8590c / #b23f00 / #3f6b2a |

Rebranding colors and fonts is one edit at the top of `styles.css`. If you change fonts, update the Google Fonts `<link>` in `index.html` too. Set `--on-accent` to `#ffffff` if the accent is dark.
Until tokens are filled, the unstyled accent colors will look broken in a browser. That is expected.

## Optional blocks (commented out in `index.html`)

Reviews, licenses/insurance, hours, quote form. Enable one only with real, client-supplied content. Never fabricate reviews, licenses, insurance, hours or ratings. If the client has none, delete the block. The JSON-LD has no rating, price or license fields on purpose.

## Launch checklist

- [ ] The grep above returns nothing (all tokens filled, unused optional blocks deleted)
- [ ] No Kyle or other client content copied over; no invented claims (years in business, licenses, "24/7", "best")
- [ ] Phone number tested: tap-to-call works on a phone, header and sticky bar both correct
- [ ] Social link opens the right page
- [ ] Real logo and photos in `images/` with meaningful `alt` text, `width`/`height`, each under 300 KB; no placeholder boxes left
- [ ] JSON-LD valid (Google Rich Results Test or schema.org validator), `sameAs` removed if no social URL
- [ ] Title, meta description, canonical, `og:url`, `og:image` set; `sitemap.xml` and `robots.txt` use the real domain
- [ ] Checked at phone width (about 375px): no horizontal scroll, call bar does not cover content, text readable
- [ ] Contrast OK (accent text on white uses the dark accent), keyboard focus visible, one `h1`
- [ ] Quote form (if enabled) sends a real test submission to the client
- [ ] Client has approved the copy in writing
- [ ] Only then deploy; point the domain; re-check live URL, then submit sitemap to Search Console
