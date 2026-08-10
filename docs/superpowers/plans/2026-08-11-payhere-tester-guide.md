# PayHere Tester Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give GitHub testers an accurate startup and troubleshooting guide for completing PayHere sandbox payments through a Cloudflare Quick Tunnel.

**Architecture:** Keep the root README as a concise project entry point and place the operational payment walkthrough in `docs/PAYHERE_TESTING.md`. Document the existing runtime flow without changing application code or environment files.

**Tech Stack:** Markdown, Next.js client on port 3000, Express API on port 4000, PayHere Checkout sandbox, Cloudflare `cloudflared` Quick Tunnel.

## Global Constraints

- Do not create, edit, copy, or document environment files or private credentials.
- Keep the normal tester workflow local: client on `http://localhost:3000`, API on `http://localhost:4000`.
- Tunnel only the Express API for PayHere's server-to-server notification.
- Use PayHere's officially published sandbox card data and link to the official source.
- Treat the PayHere browser redirect and webhook notification as separate events.

---

### Task 1: Add the detailed PayHere tester guide

**Files:**
- Create: `docs/PAYHERE_TESTING.md`

**Interfaces:**
- Consumes: repository scripts `server/package.json` → `npm run dev`, `client/package.json` → `npm run dev`; API route `GET /api/health`; webhook route `POST /api/payments/webhook`; payment URL construction in `server/src/services/paymentService.ts`.
- Produces: a stable repository-relative guide target at `docs/PAYHERE_TESTING.md` for the root README.

- [ ] **Step 1: Write the tester guide**

Create `docs/PAYHERE_TESTING.md` with these concrete sections:

1. Purpose and a short flow explanation.
2. Prerequisites: configured project checkout, Node.js 20+, npm, and `cloudflared` available on `PATH`.
3. Three-terminal startup commands:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

```powershell
cloudflared tunnel --url http://localhost:4000
```

4. A tunnel readiness check using `https://<generated-hostname>/api/health` and the requirement to update the existing `API_PUBLIC_URL` value to the generated HTTPS origin, without a trailing slash, then restart the API.
5. An explanation that the existing `CLIENT_ORIGIN` remains `http://localhost:3000` for local testing because it supplies PayHere's return/cancel URLs and the API CORS origin.
6. PayHere's official successful sandbox cards:
   - Visa: `4916217501611292`
   - Mastercard: `5307732125531191`
   - American Express: `346781005510225`
7. One representative decline card for troubleshooting, Visa insufficient funds: `4024007194349121`.
8. A numbered end-to-end checkout and verification flow.
9. A symptom/likely cause/fix troubleshooting table.
10. A reminder that Quick Tunnel URLs are temporary and the `cloudflared` terminal must remain open.
11. Official references to PayHere's sandbox/testing page and Cloudflare Quick Tunnel documentation.

- [ ] **Step 2: Verify documented repository contracts**

Run:

```powershell
rg -n '"dev"|/health|/payments/webhook|returnUrl|cancelUrl|notifyUrl' client/package.json server/package.json server/src/routes server/src/services/paymentService.ts
```

Expected: client and server `dev` scripts, `/health`, `/payments/webhook`, and all three PayHere URL fields are present.

- [ ] **Step 3: Check the new Markdown file**

Run:

```powershell
rg -n "TBD|TODO|PAYHERE_MERCHANT_SECRET|SUPABASE_SERVICE_ROLE_KEY" docs/PAYHERE_TESTING.md
git diff --check -- docs/PAYHERE_TESTING.md
```

Expected: the secret/placeholder scan has no matches and `git diff --check` reports no errors.

### Task 2: Make the tester guide discoverable from the root README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the guide created at `docs/PAYHERE_TESTING.md`.
- Produces: a concise root-level setup flow and a repository-relative link to the PayHere guide.

- [ ] **Step 1: Update root README setup content**

Keep dependency installation and the two-terminal development commands. Remove the existing instructions to copy or fill environment files. Add a `## Test PayHere payments` section after the health check with a concise explanation that PayHere's notification endpoint must be public and a relative Markdown link:

```markdown
For the complete Cloudflare Tunnel startup order, sandbox cards, payment walkthrough, and troubleshooting, see [PayHere sandbox payment testing](docs/PAYHERE_TESTING.md).
```

- [ ] **Step 2: Verify the README link and documentation-only diff**

Run:

```powershell
Test-Path docs/PAYHERE_TESTING.md
rg -n "PAYHERE_TESTING|Copy-Item|fill in" README.md
git diff --check
git status --short
```

Expected: `Test-Path` returns `True`; README contains the guide link and no environment-file setup commands; diff check passes; only the expected Markdown files are modified or untracked beyond the already committed spec and plan.

### Task 3: Final documentation verification

**Files:**
- Verify: `README.md`
- Verify: `docs/PAYHERE_TESTING.md`

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: evidence that the tester instructions agree with the current application.

- [ ] **Step 1: Review the final diff against the approved design**

Run:

```powershell
git diff -- README.md docs/PAYHERE_TESTING.md
```

Expected: documentation covers startup order, tunnel URL lifecycle, redirect/webhook distinction, public sandbox cards, end-to-end testing, and troubleshooting, without environment-file or private-credential instructions.

- [ ] **Step 2: Run repository whitespace validation**

Run:

```powershell
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Commit the implementation**

```powershell
git add README.md docs/PAYHERE_TESTING.md docs/superpowers/plans/2026-08-11-payhere-tester-guide.md
git commit -m "docs: add PayHere tunnel testing guide"
```
