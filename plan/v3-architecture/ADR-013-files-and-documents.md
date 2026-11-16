# ADR-013: Files and documents — object storage behind one interface, scanned before use

**Status:** Proposed — **storage product to confirm with the client's answers (C3, C4)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (storage service)
**Draft:** §2.3, §2.5b, §6 · **Related:** ADR-010, ADR-014, ADR-016, ADR-018

**In plain words:** uploaded files move from a folder on the server's disk to a proper storage
service, are checked for viruses before anyone can open them, and are always served through ESMS
so that only people with access to the project can get them.

## Context

- Today: files on the server's disk under a generated name, type checked by extension and first
  bytes, served through the API, **no virus scan** (a known gap), one upload per request held in
  memory, backed up by copying the folder.
- v3: several `api` instances must see the same files (ADR-016); documents per project and per
  activity; a library in two layers; site photos (D92); files move with an office export/import.
- The stand-alone shape has one disk and may have no internet.

## Decision

1. **One storage interface with two drivers:** an **object-storage driver** speaking the common
   S3-style interface (covers the major clouds' object stores and self-hosted ones) for the
   central shape, and a **filesystem driver** for the stand-alone shape. A module never sees which
   one runs.
2. **Metadata in the database, bytes in storage.** A `files.file` row holds: owner (unit, library
   layer, office), display name, detected type, size, a content hash (SHA-256), scan state, who
   uploaded it and when. The storage key is derived from the row's id, never from user input.
3. **Always through ESMS.** Downloads are streamed by the API after the permission check, or
   through a short-lived signed address created after the same check. No bucket or folder is ever
   public.
4. **Upload pipeline:** stream to storage (no whole file in memory) → detect the real type from
   the content and check it against the allowed list for that place → record the hash → state
   `pending scan` → the worker **scans with an antivirus engine** → `clean` or `quarantined`. A
   file is downloadable only when clean; a quarantined file tells the uploader and the
   administrators and is logged. Where no scanner is installed (a stand-alone server without one),
   the state is `not scanned` and shown as such — never silently treated as clean.
5. **Images:** photos are re-encoded on upload (strips hidden metadata such as location unless the
   place asks to keep it) and get a preview size.
6. **Deletion follows the owner:** soft delete with the unit or document, bytes removed by the
   purge job (ADR-010); the storage's own versioning or soft-delete window is kept on as a second
   net against mistakes.
7. **The upload limit stays a setting** shown in the interface (D92).

## Options considered

| | A. Server disk (today) | **B. Storage interface: object storage centrally, filesystem stand-alone** | C. Files inside the database | D. The client's document system (for example SharePoint) as the store |
|---|---|---|---|---|
| Several application instances | Needs a shared disk | Yes | Yes | Yes |
| Durability and backup | Our own copies | The service's (replicated, versioned) | With the database: backups grow huge | The client's |
| Stand-alone shape | Yes | Yes (filesystem driver) | Yes | No |
| Access always decided by ESMS | Yes | Yes | Yes | Two permission systems to keep in step |
| Cost and effort | Low | Low | Database size and restore time suffer | High coupling to one product |

## Trade-off analysis

A cannot serve more than one instance without a shared disk, which is the fragile part of any
installation. C is simple and transactional but ties hundreds of gigabytes to every database
backup and restore. D sounds close to the client, but it would give every file two sets of
permissions (theirs and ours) that must never disagree, and it has no stand-alone form. If the
client wants documents to *also* appear in their document system, that is an integration
(ADR-015), not the store. B is the standard shape and costs one small interface.

## Consequences

- Easier: files are safe against a lost server; scanning closes the known gap; an office export
  lists exactly its files with hashes that prove a complete copy.
- Harder: one more service in the central shape; a scanner to run and keep updated; a short wait
  between upload and first download.
- To revisit: preview of Office files (conversion to PDF in the worker) — possible on this
  pipeline, not in scope until asked.

## Action items

1. [ ] Owner: C3 and C4 (which storage service; where data may live).
2. [ ] Phase 3: the interface with the filesystem driver. Phase 7: object-storage driver, scan
   job, images, the two library layers.
