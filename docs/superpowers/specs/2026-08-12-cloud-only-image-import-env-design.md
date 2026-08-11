# Cloud-Only Product Image Import Environment Design

## Decision

Royal Bakery currently uses one hosted Supabase project. A hosted-only image
import will therefore load the existing ignored `server/.env` file instead of
requiring a duplicate `server/.env.hosted.local` file.

The alternatives considered were duplicating the credentials into
`.env.hosted.local`, silently falling back to `.env`, or adding another CLI
flag. The selected behavior is a narrow, documented default for the explicit
`--target hosted` command. It avoids duplicated secrets and does not add another
operator choice.

## Safety Boundary

- `--target hosted` maps to `server/.env`.
- `--target local` continues to map to `server/.env.local`.
- `--target all` remains target-separated and requires
  `server/.env.local` plus `server/.env.hosted.local`; it must not reuse the
  shared hosted `.env` file.
- The importer continues to clear Supabase variables before and after loading a
  target file and never prints credentials.
- Dry-run remains the default. Writes still require the explicit import command.

This preserves the existing protection against accidentally treating one cloud
credential file as both local and hosted when an operator selects `all`.

## Verification

Tests will first demonstrate that hosted currently selects
`.env.hosted.local`. They will then require hosted-only selection to use `.env`,
while `all` retains the two isolated target files. README examples will describe
the cloud-only path and the optional dual-target path separately.

After implementation, the workflow is:

1. Run the hosted dry-run and require all 31 mappings to validate with no writes.
2. Run the explicit hosted import with URL verification.
3. Require 31 validated, uploaded, and updated products, zero failures, HTTP 200,
   and `image/webp` for every stable `<product-id>/catalog.webp` URL.

If dry-run validation fails, no write-enabled command will run. If the write or
verification phase fails, the per-target report and non-zero exit remain visible.
