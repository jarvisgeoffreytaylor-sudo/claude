# Payments and the service call fee

Real fact: Temp Tech charges a **$100 service call fee** (a show-up fee). The site discloses it before a customer requests a visit and again before they send the request, and asks them to tick "I understand there is a $100 service call fee." The wording is deliberately careful: the fee "covers the visit and diagnosis", any repair cost is explained, and the customer approves it before work begins. The site does **not** say the fee is credited toward a repair, waived, or refundable, because those answers are not known yet.

## Day-one model

1. Disclose the fee on the site (done) and in the request payload (`feeAcknowledged: true`, `serviceCallFeeUsd: 100`).
2. Take **no card online**.
3. Collect the fee at the visit.
4. Quote any repair, get the customer's approval, then invoice after the work.

The confirmation screen says "due at the visit", which matches this model. If the owner chooses a different way of collecting, change that line in the summary (search for "due at the visit" in `index.html`).

## Ways to collect, simplest first

1. **Housecall Pro invoices and card payments.** They already use it for some jobs. Enter every phone job there as well, or invoice from there, so one system holds the fee, the quote and the payment.
2. **Stripe Payment Links, Stripe Invoicing or Square invoices.** A simple pay link sent by text or email at the visit, with no integration on the website.
3. **Later: card on file at request time (Stripe).** The card is saved but not charged until the visit. This needs a backend, and clear terms for no-shows and late cancellations.

## Owner decisions

- Is the $100 credited toward a repair, or not? (The site currently makes no claim either way.)
- No-show and late-cancellation policy.
- Replacement estimates: the current site says estimates on a complete system replacement are free. How does that interact with the $100 fee?
- Accepted payment methods (card, cash, check, digital wallets).
- Sales tax handling on the fee and on repairs.

## Before any online payment exists

Card networks and Google expect the fee to be disclosed clearly before payment, along with a visible refund and cancellation policy. Add that policy text (and a link from the checkout or request form) before taking money online.
