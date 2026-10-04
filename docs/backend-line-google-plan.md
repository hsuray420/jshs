# JSHS backend and LINE implementation notes

## Current service boundaries

- Cloudflare Workers runs the application and Cloudflare D1 stores dynamic server-side records.
- The planned D1 domains are Core identity, Learning, and Community. Their schema files are proposals until provisioned and validated in Cloudflare.
- GitHub Contents API remains the source of truth for official school/admissions/district CSV.
- ImageKit is the target for public school-image binaries; uploading new images is disabled unless server-side ImageKit settings exist.
- LINE Login and friend verification are already implemented. LINE provider IDs map to stable JSHS internal UUIDs.

## LINE operational configuration

Configure and protect the existing LINE Login / friend-check credentials in the Worker environment. The callback verifies the authorization response, checks friend status, resolves or creates the JSHS identity mapping, and issues a signed HttpOnly member session. New member data APIs use the internal UUID from that session; a client-provided owner ID is not trusted.

The `/api/line/webhook` endpoint is not implied by the login flow and must not be advertised as implemented unless the repository contains an active webhook handler.

## Data handling rules

- Guest-personalized scores, mock exams, planner drafts, and favorites stay in browser storage.
- A member sees an import prompt after login if this browser contains guest records. No records are uploaded until the member chooses Import.
- Anonymous community submissions are separate from user identity and learning records.
- Public official CSV remains in GitHub; private member and community records do not.

## Rollout

Create and test D1 domains in staging, migrate with stable UUIDs and row-conservation/readback checks, and only then attach production bindings. Keep the original `DB` binding during the recovery window. See [storage-upgrade.md](./architecture/storage-upgrade.md) for the detailed safety gates.

## Search and analytics

Google Search Console, Analytics, sitemap, canonical metadata, and structured data are independent from member-data storage. Use the existing production configuration and verify each service in its own console; do not infer activation from UI presence alone.
