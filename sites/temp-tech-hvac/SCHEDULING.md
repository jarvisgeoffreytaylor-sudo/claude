# Request flow and scheduling notes

The website collects visit **requests**, not exact appointments. The owner confirms the real time by phone or text. This suits a business where most jobs come in by phone and the schedule moves during the day.

## What the front end does now

- "Request a visit" (header, hero, mobile bar, contact) opens a 3-step dialog:
  1. Service: the four services, "Not sure yet", or "Emergency, call now" (shows the phone link, no form).
  2. Preferred day (next 14 weekdays, first open day preselected) and window: Morning (7-12), Afternoon (12-5), Anytime. No exact slots.
  3. Name, phone, address or ZIP, optional note.
- The request is sent according to `BOOKING_MODE` (see below). The confirmation says: "Request received. We will call or text to confirm your time, and we will let you know if anything changes." In `demo` mode it is labelled "(demo)" and nothing is sent.
- The hero dial can carry context into the request: an optional **indoor temperature** (the customer's own reading: it is sent only if they moved the dial, and it is editable or removable in the dialog) and the live **outside temperature** for Cleveland (Open-Meteo, only when available).
- Days or windows that are blocked, full, or too soon show "Call us" instead of being hidden.
- Everything is computed in the business timezone (`America/New_York`), whatever the visitor's device says.

## Config (top of the `<script>` in `index.html`)

| Setting | Meaning | Status |
|---|---|---|
| `BOOKING_MODE` | `'netlify'` (shipped), `'endpoint'` or `'demo'`; see "Netlify Forms" below | shipped as `'netlify'` |
| `BOOKING_ENDPOINT` | URL that receives the JSON POST when `BOOKING_MODE` is `'endpoint'` | only for a custom backend |
| `AVAILABILITY_ENDPOINT` | Optional GET returning existing requests so full windows show "Call us". Empty = none | optional |
| `AVAILABILITY.timezone` | Business timezone | `America/New_York` |
| `weekdays`, `open`, `close` | Mon-Fri 7AM-5PM | real (from the current site) |
| `windows` | Morning 7-12, Afternoon 12-5, Anytime | hours real, noon split owner to confirm |
| `maxWeekdays` | How far ahead (weekdays) | 14, owner to confirm |
| `minLeadHours` | Windows starting sooner show "Call us" | 12, owner to confirm |
| `maxPerWindow`, `maxPerDay` | Request caps per day and window | 20 / 40, deliberately high, owner to confirm |
| `blockedDates`, `blockedRanges` | Days off, holidays, time off | empty |
| `requests` | Existing requests `[{day:'2026-10-05', window:'morning'}]` | filled by the endpoint or `setRequests()` |

Helpers on `window.TempTechScheduling`: `getSlots(config, serviceId, now)` (pure; returns days with windows), `setRequests(list)`, `loadRequests()`, `submitBooking(payload)`, `setEndpoints({booking, availability})`.

## Payload (JSON in `'endpoint'` mode; the same fields as form fields in `'netlify'` mode, plus `submittedAt` and `pageUrl`)

```json
{
  "service": "Heating Installs & Repairs",
  "serviceId": "heat",
  "day": "2026-10-05",
  "window": "morning",
  "timezone": "America/New_York",
  "name": "Jane Doe",
  "phone": "216-555-0100",
  "address": "44039",
  "note": "optional text",
  "feeAcknowledged": true,
  "serviceCallFeeUsd": 100,
  "indoorTempF": 58,
  "indoorTempSource": "dial",
  "outdoorTempF": 41
}
```

`feeAcknowledged` is always `true` (the customer ticked the service call fee box); see `PAYMENTS.md`. `window` is `morning`, `afternoon` or `anytime`. `indoorTempF` (with `indoorTempSource: "dial"`) is the customer's reading and is left out unless they moved the dial; `outdoorTempF` is the live Cleveland value and is left out when weather is unavailable. The server should reply `2xx` on success; `409` means the window just filled up (the form returns to step 2); any other error shows a retry message with the phone number.

## Going live, simplest first

1. **Request inbox (recommended day one).** Netlify Forms already covers the form-service route (see below). To feed a dispatch board instead, set `BOOKING_MODE = 'endpoint'` and point `BOOKING_ENDPOINT` at the board's Requests inbox. The owner confirms by phone or text and moves the request onto the schedule. There is no double-booking risk because nothing is promised online. Jobs taken by phone, or from Housecall Pro, are entered directly on the board; if their Housecall Pro plan includes API access, those jobs can be synced in later. The board can also return existing requests through `AVAILABILITY_ENDPOINT` so crowded days show "Call us".
2. **Hosted scheduler or field-service tool.** If the client wants customers to pick exact times, embed or call Cal.com, Calendly, or a field-service tool such as Jobber or Housecall Pro (if their plan has online booking). This replaces step 2 and needs the owner's real job lengths.
3. **Small serverless function.** A function reads Google Calendar free/busy, writes requests as events, and feeds `AVAILABILITY_ENDPOINT`. Most flexible, most to maintain.

## Decisions for the owner

- Are windows enough, or are exact times wanted later? Where should the morning and afternoon split fall?
- Job lengths per service, and travel or buffer time, if exact times are ever used.
- Same-day and emergency policy (lead time, and whether "Anytime" requests are welcome).
- How many technicians or crews, so the per-window caps are realistic.
- Where requests should land: the dispatch board, email, text, or all three.

## Content to confirm before launch

Service descriptions, FAQ answers, the "How we work" principles, service area wording, hours, and the insurance wording ($1.5 million coverage). Do not claim "licensed" or "bonded" until the client supplies licence details.

## Google reviews and the customer review flow

- `window.REVIEWS_CONFIG` (its own commented `<script>` in the `<head>`) holds **real** Google data only: `googleWriteReviewUrl` (`https://search.google.com/local/writereview?placeid=PLACE_ID`, owner supplies the Place ID), `googleProfileUrl`, `aggregate:{rating,count}` and `reviews:[{author, rating, text, dateISO, sourceUrl?}]`.
- Copy reviews in exactly as written on Google, with the real rating, and do not cherry-pick in a misleading way. Leave everything empty until real data exists: the page then shows a calm "Tell us how we did" block with the review button, and no stars, no counts and no `aggregateRating` structured data.
- If `googleWriteReviewUrl` is empty, the button falls back to a Google Maps search for the business, so it still works.
- "Leave a review" opens a 3-step sheet (comfort rating, details, share). The customer's text is copied to the clipboard and Google's review page opens in a new tab. Customer-typed reviews are never shown on this site.
- Private feedback is offered to everyone, whatever their rating; the Google option is never hidden or routed by rating (Google forbids review gating), and no incentives may be offered. Private feedback follows `FEEDBACK_MODE` (Netlify form `feedback` by default; JSON to `FEEDBACK_ENDPOINT` in `'endpoint'` mode; nothing sent in `'demo'`): `{rating, service?, stoodOut?, message, name?, contact?, source, submittedAt}`.

## Netlify Forms (the shipped setup)

The page ships with `BOOKING_MODE = 'netlify'` and `FEEDBACK_MODE = 'netlify'` (config block at the top of the page script). Modes: `'netlify'` posts a urlencoded form to `/`; `'endpoint'` posts JSON to `BOOKING_ENDPOINT` / `FEEDBACK_ENDPOINT` as described above; `'demo'` sends nothing and labels the dialog as a demo. The marker lines can be swapped by exact string replace, for example `var BOOKING_MODE = 'netlify' /*BOOKING_MODE*/;` to `'demo'` in a preview copy.

How it works: Netlify only detects forms that exist in the deployed HTML, so the page contains two hidden, inert static forms (`request` and `feedback`) listing every field. The real submissions are sent by script with the same field names (`FORM_FIELDS` in the script); a test compares the two lists. Optional fields (`indoorTempF`, `indoorTempSource`, `outdoorTempF`) are left out when not available. A honeypot field (`bot-field`) is sent empty.

Setup:
1. In the Netlify project, make sure form detection is enabled (Site configuration > Forms), then deploy. Check that the `request` and `feedback` forms appear under Forms.
2. Add email notifications: Forms > Form notifications > add an email notification for each form (to the owner).
3. Spam: the honeypot is built in; Netlify also applies spam filtering and offers reCAPTCHA if ever needed. Check Netlify's current plan limits for how many submissions per month are included.
4. Netlify Forms stores submissions and can email them, but it does not itself send text messages. For texts, use a notification integration, a Zap, or the dispatch board.

If the form endpoint is not available (for example forms not enabled, so Netlify answers 404), the visitor sees the plain error with "Try again" and the phone number, never a false success.
