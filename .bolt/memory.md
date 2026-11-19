# Project memory

## Product intent & audience

- App likely involves processing/reading documents (PDF and Word), inferred from included libraries `mammoth` and `pdfjs-dist`.
- Exact product type, target audience, and core user flows are not yet defined.

## Brand personality & voice

- Assistant communicates in Russian; user writes in Russian.

## Visual design & UX direction

- Styling via Tailwind CSS; icons via `lucide-react`.
- No design decisions made yet.

## Decisions, constraints & rationale

- Tech stack: Vite + React + TypeScript.
- Backend/auth/data: Supabase.
- Document parsing: `mammoth` (Word), `pdfjs-dist` (PDF).
- Project is a clean starter — no pages or components exist yet.

## Open questions & assumptions

- What is the app? (document reader, converter, library, analyzer, etc.)
- What should users do with documents? (upload, view, search, annotate, convert)
- Is authentication required or is the site open?
- Assumption: Supabase will be used for auth and data storage, but this is unconfirmed.