# PayHere sandbox payment testing

Use this guide to test Royal Bakery's PayHere checkout from a local GitHub checkout. The Next.js client and Express API continue to run locally; Cloudflare Tunnel gives PayHere a temporary public HTTPS address for its server-to-server payment notification.

## How the payment flow works

1. Your browser opens the client at `http://localhost:3000`.
2. The client asks the API at `http://localhost:4000` to create the PayHere checkout fields.
3. Your browser submits those fields to PayHere Sandbox.
4. PayHere posts the payment result to the public `notify_url`.
5. Cloudflare forwards that request to the local API at `/api/payments/webhook`.
6. The API verifies the notification and updates the order.
7. PayHere redirects your browser back to the local order page.

The redirect and notification are separate. Returning to the order page does not prove that the webhook succeeded; the order becomes paid only after the API processes PayHere's notification.

## Prerequisites

- The project checkout is configured and its dependencies are installed.
- Node.js 20 or newer and npm are available.
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) is installed and available on `PATH`.

## Start the application and tunnel

Use three terminals and keep all three processes running.

### Terminal 1: start the API

From the repository root:

```powershell
cd server
npm run dev
```

Confirm the local health check returns `{ "status": "ok" }`:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

### Terminal 2: start the client

From the repository root:

```powershell
cd client
npm run dev
```

Open `http://localhost:3000` in the same computer's browser.

### Terminal 3: expose the API

```powershell
cloudflared tunnel --url http://localhost:4000
```

No Cloudflare account is required for a Quick Tunnel. Wait for `cloudflared` to print an address similar to:

```text
https://random-words.trycloudflare.com
```

Keep this terminal open. Stopping `cloudflared` removes PayHere's path to the local webhook.

## Connect PayHere to the current tunnel

1. Copy the generated HTTPS origin without a trailing slash.
2. Replace the existing `API_PUBLIC_URL` value with that origin. For example, use `https://random-words.trycloudflare.com`, not a URL ending in `/api/payments/webhook`.
3. Keep the existing `CLIENT_ORIGIN` as `http://localhost:3000` for this local workflow. It supplies the browser return/cancel URLs and the API's allowed CORS origin.
4. Restart the API so it loads the new tunnel URL.
5. Verify the public route before starting a payment:

```powershell
Invoke-RestMethod https://random-words.trycloudflare.com/api/health
```

It must return `{ "status": "ok" }`. Replace the example hostname with the URL printed in your terminal.

> A Quick Tunnel gets a temporary random hostname. If you restart `cloudflared`, update `API_PUBLIC_URL`, restart the API, and initiate a new payment.

## PayHere sandbox cards

These card numbers are published by PayHere for simulated sandbox payments. No real payment is processed.

| Scenario | Card type | Card number |
| --- | --- | --- |
| Successful payment | Visa | `4916217501611292` |
| Successful payment | Mastercard | `5307732125531191` |
| Successful payment | American Express | `346781005510225` |
| Declined: insufficient funds | Visa | `4024007194349121` |

For the cardholder name, CVV, and expiry date, PayHere permits any valid-looking values in Sandbox. Use a future expiry date.

The full list of success and decline scenarios is in [PayHere's official Sandbox & Testing guide](https://support.payhere.lk/sandbox-and-testing).

## Complete a successful payment test

1. Confirm the API, client, and `cloudflared` terminals are still running.
2. Confirm the public health URL returns `{ "status": "ok" }`.
3. Open `http://localhost:3000`, sign in, and complete the account profile if required.
4. Add a product to the cart and place an order.
5. Open the order and select **Pay now**.
6. At PayHere Sandbox, enter one of the successful cards above and valid-looking card details.
7. Complete the sandbox checkout and wait for PayHere to return to the local order page.
8. Confirm the order shows a paid status. The page checks for an updated status every three seconds for approximately thirty seconds.

If the browser returns successfully but the order stays unpaid, troubleshoot the webhook rather than repeating the redirect.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Public health URL does not load | The API or tunnel is stopped, or the hostname is stale | Start the API and `cloudflared`; use the newest printed hostname and test `/api/health` again. |
| Order stays pending or unpaid after a successful checkout | PayHere used an old or unreachable `notify_url` | Update the existing `API_PUBLIC_URL` to the current tunnel origin, restart the API, and initiate a new payment. |
| PayHere returns to an unavailable page | The client is stopped or its origin is wrong | Start the client and confirm `http://localhost:3000` opens in the same browser. |
| Browser reports a CORS error | The origin used in the browser does not match `CLIENT_ORIGIN` | For local testing, open exactly `http://localhost:3000` and keep the matching client origin. |
| New tunnel URL is ignored | The API is still using values loaded before the change | Restart `npm run dev` in the API terminal, then initiate a new payment. |
| Payment is declined | A decline-scenario card or unsupported card was used | Retry with one of PayHere's successful sandbox cards. |
| Quick Tunnel fails to start | A local Cloudflare configuration conflicts with Quick Tunnels | Check Cloudflare's Quick Tunnel documentation; a `.cloudflared/config.yaml` file can prevent Quick Tunnels from running. |

## References

- [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
- [PayHere Checkout API](https://support.payhere.lk/api-%26-mobile-sdk/checkout-api.I)
- [PayHere Sandbox & Testing](https://support.payhere.lk/sandbox-and-testing)
