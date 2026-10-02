# Owner TODO (Kyle's Outdoor Services)

Only verified facts are on the site: name, Cleveland OH, phone (216) 870-4153, Facebook link, stump grinding, dumpsters, "more: just ask".

- [ ] Logo file (see `images/README.md`).
- [ ] Hero photo (see `images/README.md`).
- [ ] Confirm the list of other jobs you do. Site only says "More: just ask".
- [ ] Domain name, then add canonical URL, og:image, `url` in the JSON-LD, sitemap.xml and robots.txt.
- [ ] Recent posts feed (Facebook Page Plugin iframe): it only works while the Facebook page is public, and it shows whatever is posted there, so keep the page professional. The plugin loads Facebook content and trackers, so consider adding a short privacy line. Later option: Facebook Graph API (needs a page admin access token and a server-side proxy to keep the token private).
- [ ] Contact form (Netlify Forms): enable Forms for the site in Netlify (Site configuration > Forms), then deploy so Netlify detects it. Form name is `contact`. Set where messages go under Netlify > Forms > Form notifications (add your email). Spam: honeypot field `bot-field` is built in; reCAPTCHA is optional. Test one submission after deploy; it cannot be tested locally.
- [ ] Optional, only if you want them shown: email, hours, service area beyond Cleveland, license/insurance, pricing, reviews (with permission). None are on the site.
