# Owner TODO (Kyle's Outdoor Services)

Only verified facts are on the site: name, Cleveland OH, phone (216) 870-4153, Facebook link, stump grinding, "more: just ask".

- [ ] Source notes: "Snow and ice removal, including salting" came from the owner verbally, not from the Facebook page. It is in the services list, form dropdown, hero line, meta description and og:description. "Tree removal" is only in the form dropdown, pending confirmation; it is not in the services list.
- [ ] Logo file (see `images/README.md`).
- [ ] Hero photo (see `images/README.md`).
- [ ] Confirm the list of other jobs you do. Site only says "More: just ask".
- [ ] Custom domain (optional). SEO currently uses https://kyles-outdoor-services.netlify.app. If the domain changes, find and replace that URL in exactly these files:
  - `index.html`: `<link rel="canonical">`, `og:url`, `og:image` (the `/images/logo.png` URL), and `url` and `image` in the JSON-LD.
  - `sitemap.xml`: the `<loc>` URL.
  - `robots.txt`: the `Sitemap:` line.
  - `thanks.html` has no URLs and stays `noindex`; it is not in the sitemap.
  - Then re-submit the sitemap in Google Search Console. Also swap `og:image` for a real photo if you add one.
- [ ] Recent posts feed (Facebook Page Plugin iframe): it only works while the Facebook page is public, and it shows whatever is posted there, so keep the page professional. The plugin loads Facebook content and trackers, so consider adding a short privacy line. Later option: Facebook Graph API (needs a page admin access token and a server-side proxy to keep the token private).
- [ ] Contact form (Netlify Forms): enable Forms for the site in Netlify (Site configuration > Forms), then deploy so Netlify detects it. Form name is `contact`. Set where messages go under Netlify > Forms > Form notifications (add your email). Spam: honeypot field `bot-field` is built in; reCAPTCHA is optional. Test one submission after deploy; it cannot be tested locally.
- [ ] Optional, only if you want them shown: email, hours, service area beyond Cleveland, license/insurance, pricing, reviews (with permission). None are on the site.
