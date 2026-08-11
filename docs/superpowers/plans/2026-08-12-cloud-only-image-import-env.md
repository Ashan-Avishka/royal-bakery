# Cloud-Only Product Image Import Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an explicit hosted-only product-image import use the existing ignored `server/.env` file without weakening local/all target isolation.

**Architecture:** Keep target-to-file selection in `targetEnvironmentFiles`. Extend only the hosted-only branch to select `.env`; the `all` branch continues returning `.env.local` and `.env.hosted.local`. The existing loader, variable clearing, dry-run default, reporting, and verification pipeline remain unchanged.

**Tech Stack:** TypeScript, Node.js, dotenv, Vitest, npm scripts, Supabase Storage.

## Global Constraints

- `--target hosted` uses `server/.env`.
- `--target local` uses `server/.env.local`.
- `--target all` requires the isolated `server/.env.local` and `server/.env.hosted.local` files.
- Never print or commit credentials.
- Never run write mode when the hosted dry-run has failures.
- A successful hosted write must verify all 31 stable WebP URLs.

---

### Task 1: Select the cloud-only environment safely and execute the import

**Files:**
- Modify: `server/scripts/importProductImages.test.ts`
- Modify: `server/scripts/importProductImages.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `targetEnvironmentFiles(target: ImageImportTarget)` and the existing `server/.env` Supabase variables.
- Produces: hosted-only mapping `{ name: "hosted", fileName: ".env" }`; all-target mapping remains isolated.

- [ ] **Step 1: Write the failing target-selection test**

Add a behavior test that requires the explicit hosted target to use `.env` while preserving the two-file `all` mapping:

```ts
it("uses the application env for hosted-only imports without weakening all-target isolation", () => {
  expect(targetEnvironmentFiles("hosted")).toEqual([
    { name: "hosted", fileName: ".env" },
  ]);
  expect(targetEnvironmentFiles("all")).toEqual([
    { name: "local", fileName: ".env.local" },
    { name: "hosted", fileName: ".env.hosted.local" },
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd server && npm.cmd test -- scripts/importProductImages.test.ts`

Expected: FAIL because hosted-only currently returns `.env.hosted.local`.

- [ ] **Step 3: Implement the minimal mapping change**

Extend the file-name union and change only the hosted-only branch:

```ts
export interface TargetEnvironmentFile {
  name: Exclude<ImageImportTarget, "all">;
  fileName: ".env" | ".env.local" | ".env.hosted.local";
}

if (target === "hosted") {
  return [{ name: "hosted", fileName: ".env" }];
}
```

Do not change the `all` branch.

- [ ] **Step 4: Document cloud-only and dual-target commands**

Update `README.md` so hosted-only users keep credentials in `server/.env` and run:

```powershell
cd server
npm run images:dry-run -- --target hosted
npm run images:import -- --target hosted --verify
```

Retain `.env.local` and `.env.hosted.local` instructions only for `--target all`.

- [ ] **Step 5: Run focused and full automated verification**

Run:

```powershell
cd server
npm.cmd test -- scripts/importProductImages.test.ts
npm.cmd test
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 6: Run the hosted dry-run and enforce the write gate**

Run: `cd server && npm.cmd run images:dry-run -- --target hosted`

Expected before writes: `environmentName: hosted`, `validated: 31`, `uploaded: 0`, `updated: 0`, and an empty `failures` array. If any failure is reported, stop without executing Step 7.

- [ ] **Step 7: Import and verify hosted images**

Run: `cd server && npm.cmd run images:import -- --target hosted --verify`

Expected: `validated: 31`, `uploaded: 31`, `updated: 31`, empty `failures`, and exit code 0 after every URL returns HTTP 200 with `image/webp`.

- [ ] **Step 8: Commit**

```powershell
git add server/scripts/importProductImages.ts server/scripts/importProductImages.test.ts README.md
git commit -m "fix(images): use cloud env for hosted import"
```
