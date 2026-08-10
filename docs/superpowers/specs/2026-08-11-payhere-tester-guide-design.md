# PayHere Tester Guide Design

**Date:** 2026-08-11

## Goal

Give a tester who obtains the project from GitHub a reliable, concise path to run the Royal Bakery application and complete a PayHere sandbox payment while the Express API is exposed through a temporary Cloudflare Tunnel.

## Scope

This change is documentation-only. It will:

- add a prominent payment-testing link to the root `README.md`;
- add `docs/PAYHERE_TESTING.md` as the detailed operational guide;
- document the client, API, and Cloudflare Tunnel startup order;
- explain the separate roles of PayHere's browser redirect URLs and server-to-server notification URL;
- include PayHere's publicly documented sandbox card numbers;
- provide an end-to-end success checklist and focused troubleshooting.

It will not document, create, copy, or distribute environment files, merchant credentials, Supabase credentials, or other secrets. Testers receive the configured environment files separately.

## Documentation Structure

### Root README

The root `README.md` remains the main project entry point. Its setup section will stop instructing testers to create environment files and will instead state only that the separately supplied environment files must already be present. A short PayHere testing section will link to `docs/PAYHERE_TESTING.md`.

### PayHere Testing Guide

`docs/PAYHERE_TESTING.md` will be task-oriented and contain:

1. prerequisites for the existing Node.js applications and the `cloudflared` executable;
2. commands for starting the API on port 4000, the client on port 3000, and a Cloudflare Quick Tunnel targeting the API;
3. the required relationship between the generated `trycloudflare.com` URL and the existing `API_PUBLIC_URL` value;
4. an explanation that `CLIENT_ORIGIN` remains the browser-accessible client origin and controls both PayHere return/cancel redirects and API CORS;
5. the public PayHere sandbox cards for successful and selected failed-payment scenarios;
6. the application steps to create an order, initiate payment, complete PayHere checkout, return to the order page, and confirm the final payment status;
7. troubleshooting for an unreachable webhook, a stale Quick Tunnel URL, an incorrect API/client URL, CORS failures, an API restart omission, and a payment that remains pending.

## Runtime Flow

The documented payment flow is:

1. The tester opens the Next.js client at `http://localhost:3000`.
2. The client asks the Express API at `http://localhost:4000` to initiate payment.
3. The API produces PayHere checkout fields.
4. The browser posts those fields to PayHere's sandbox checkout.
5. PayHere sends its payment notification to the public Cloudflare URL ending in `/api/payments/webhook`.
6. Cloudflare forwards that request to the local Express API on port 4000.
7. The API verifies the signature and updates the payment and order records.
8. PayHere redirects the tester's browser to the local order page through the configured client origin.

The guide will emphasize that the browser redirect is not proof that the webhook succeeded. The order becomes paid only after the server-to-server notification is accepted and processed.

## Cloudflare Tunnel Behavior

The guide will use a temporary Quick Tunnel:

```powershell
cloudflared tunnel --url http://localhost:4000
```

Quick Tunnel hostnames are ephemeral and intended for testing. The tunnel command must keep running. When its generated URL changes, the existing `API_PUBLIC_URL` value must be updated to that exact HTTPS origin and the API must be restarted before initiating another payment.

## Public Sandbox Test Data

The guide will include PayHere's published sandbox cards, with a link to the official sandbox-testing page. It will explain that a valid-looking future expiry, CVV, and cardholder name can be used in the sandbox. These payment test values are public test data, not merchant credentials.

## Error Handling and Troubleshooting

Troubleshooting will start from observable symptoms:

- **PayHere cannot notify the application:** verify the tunnel process and health endpoint through the public URL.
- **Order remains unpaid or pending:** verify `API_PUBLIC_URL`, restart the API, and initiate a new payment after the restart.
- **Return redirect fails:** verify the client is running and the configured client origin is reachable from the tester's browser.
- **Browser reports CORS errors:** verify the client origin matches the URL used to open the application.
- **Tunnel URL no longer works:** start a new Quick Tunnel, update the already supplied configuration, and restart the API.

The guide will avoid suggesting that testers expose the Next.js client unless they intentionally test from another device. The standard GitHub tester path assumes all three processes run on the tester's own computer.

## Verification

Because this is documentation-only, verification consists of:

- checking every documented command against repository scripts and ports;
- confirming every referenced file and route exists;
- confirming Markdown links resolve inside the repository;
- scanning for secrets or credential-shaped values other than PayHere's officially public sandbox card numbers;
- reviewing the final diff for consistency with the implemented payment flow.
