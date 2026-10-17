# Song-library database review

**Date:** 17 October 2026  
**Scope:** Implemented v2 schema, validators, repository, editor, service projection and backup contracts. No user database was opened or modified.  
**Verdict:** Retain the nested song aggregate and independent service snapshots. Strengthen integrity and revision handling before extending authoring or occurrence-aware presentation.

## 1. Current structure

The PWA uses Dexie/IndexedDB, not SQLite. The database name is scoped by the installation base path. Database schema version 2 adds migration provenance to version 1; this is separate from backup-format and imported v1 schema versions.

| Store | Primary key and indexes | Purpose |
| --- | --- | --- |
| content | id; kind, title, updatedAt | Songs and reusable slide sets, each stored as a complete document |
| services | id; title, updatedAt | Service orders with independent content snapshots |
| media | id; hash, title | Shared local media metadata and blobs |
| settings | key | Selected-service and supported application settings |
| frames | id; sessionId, createdAt | Prepared output records, separate from library masters |
| provenance | id; createdAt | Inert source conversion data and reports |

A song document contains metadata, an ordered sections array, and arrangements. Each section contains ordered pages. Each page stores public title, primary/secondary text, style and media references. An arrangement contains ordered section IDs; repeating an ID deliberately repeats its section without copying lyrics. A default arrangement is required. Auto arrangements are intended to follow section order; custom arrangements preserve explicitly selected repeats/order.

Slide sets share Content but use top-level pages. Service items retain sourceId for provenance and a deep-copied Content snapshot plus independent sectionOrder, notes and item overrides. sourceId is intentionally not a mandatory foreign key: deleting a library master leaves the service copy usable.

## 2. What should be retained

- Store a song and its structure as one aggregate. Most edits, validation and export operate on the whole song. Splitting every section/page into separate stores adds transactions and joins without demonstrated need.
- Preserve stable content, section, page and arrangement IDs. Labels and church song numbers are not identifiers.
- Keep church numbers as text, including leading zeros and alphanumeric prefixes. Do not impose uniqueness on title, number or CCLI number; legitimate alternate versions exist.
- Preserve bilingual text channels and explicit line breaks. Language display selection must not erase stored text.
- Keep media blobs separate from text records. Existing save transactions verify media references; media deletion checks library, service and prepared-frame references.
- Keep service snapshots independent. Do not replace them with live pointers into the library.
- Keep transactional backup export and replace restore. Existing backup validation reuses content/service validators, so strengthening those validators affects import compatibility too.

## 3. Findings in priority order

Priority 1 denotes a correction needed before the affected new workflow; Priority 2 denotes hardening or scale work. No finding establishes an exploited vulnerability or actual loss of user data.

### DB-01: Flattened presentation identity loses repeated occurrences (Priority 1)

**Evidence:** model.ts servicePages generates id as item.id + ':' + page.id. Repeated arrangement references return the same page and therefore the same generated ID. A synthetic valid song repeating one section produced two projected pages but one unique ID.

**Effect:** This is a derived navigation-model issue, not a corrupt stored song. It cannot uniquely identify the second chorus occurrence. The current operator list includes an array index in its React key, so this does not establish a current duplicate-key failure. It is a concrete blocker for reliable occurrence-based section selection and acknowledgement identity in the redesign.

**Recommendation:** Keep the stored page ID as source identity and derive a separate destination key containing service item, arrangement occurrence position and page identity. Include explicit section/occurrence/page context in the projection. Temporary section destinations need a runtime identity outside the saved arrangement. Do not rewrite page IDs to represent repeats.

### DB-02: Content-kind hierarchy is not exclusive (Priority 1)

**Evidence:** validateContent accepts a song with nonempty top-level pages and a slide set with populated sections/arrangements. contentPages ignores song top-level pages and slide-set sections. Both cases were reproduced with synthetic records. Media-reference enumeration still includes both branches.

**Effect:** Accepted data can contain text that is stored/exported and referenced but never presented, leading to confusing edits and unnecessarily retained media. This does not prove that ordinary current UI creation generates these records.

**Recommendation:** Define a discriminated stored contract: song uses sections/arrangements and an empty top-level pages array; slides uses top-level pages and empty sections/arrangements. First audit conversion output and historical backups. Reject ambiguous new writes; handle legacy mixed data through an explicit, loss-preserving migration/quarantine report. Never silently delete the hidden branch while tightening validation.

### DB-03: Auto-arrangement correctness depends on UI calls (Priority 1)

**Evidence:** syncAuto is invoked by editor operations, including the Save handler. Repository saveContent and validateContent do not enforce that an auto arrangement's sectionIds match section order. An auto arrangement with repeated section IDs was accepted by the validator.

**Effect:** A different writer/importer can persist an auto arrangement whose stored order contradicts its flag. Later editor synchronisation may unexpectedly change that order.

**Recommendation:** Define the invariant at the model/repository boundary. Reject inconsistent new writes with an actionable error, or normalise only through an explicit authoring operation. Imported inconsistent records need a compatibility decision, such as preserving their order as custom; do not silently rewrite them merely because auto is true. Multiple auto arrangements are not inherently invalid if each obeys the documented invariant.

### DB-04: Saves have no stale-edit detection (Priority 1 for multi-tab authoring)

**Evidence:** saveContent/saveService put the supplied full document and assign updatedAt at write time. They do not compare an expected revision with the current record. Presentation/maintenance locks do not serialize ordinary authoring edits.

**Effect:** IndexedDB transactions serialize commits but cannot prevent an old document from another tab overwriting newer lyrics. This is an inferred lost-update risk from the save contract; a concurrent-tab loss was not reproduced during this review. updatedAt is not a concurrency token and does not identify the source revision used for an edit.

**Recommendation:** Introduce a monotonically increasing revision and compare expectedRevision within the read/write transaction. Reject stale saves and retain the worker's draft for comparison. Define creation separately from updating a missing/deleted record so an old tab cannot silently recreate a deleted song. A single-tab write queue also prevents stale UI completion claims but is not a substitute for cross-tab comparison.

### DB-05: Source relationship does not identify a saved arrangement or baseline revision (Priority 2)

**Evidence:** makeItem copies Content and selected sectionIds but stores neither the selected arrangementId nor an explicit sourceRevision. The snapshot contains the source's then-current metadata/timestamp, but updatedAt alone is an unreliable comparison baseline, particularly after service-copy edits.

**Effect:** Several arrangements may have identical sequences. A future “Library changed” indicator or selective refresh cannot reliably infer the original choice from sectionOrder. Source deletion is still valid and must remain supported.

**Recommendation:** Add optional sourceRevision/sourceArrangementId or an explicitly defined source fingerprint when implementing source comparison. Record a baseline separately from service-copy edits. Treat unknown legacy baselines as unknown; never auto-refresh a service. A mismatch means changed content, not necessarily a required update.

### DB-06: Search loads complete documents; indexes are minimal (Priority 2, scale-dependent)

**Evidence:** the editor scans the loaded content collection, concatenating title, number, tags, author and lyric text. Lyric search already exists. It performs lowercase substring matching without whitespace normalisation. Song number and language are not IndexedDB indexes; metadata and lyrics are read together.

**Effect:** There is no measured scale failure yet. Larger collections may increase initial load, allocation and search cost. Text tags and language names are flexible but not controlled vocabularies.

**Recommendation:** Benchmark representative synthetic library sizes before normalising the schema. First memoise derived normalised search text and debounce/filter appropriately. If needed, add rebuildable search projections and useful indexes; update them transactionally with content. Preserve exact original lyrics and numbers. Do not add a unique index for duplicate suggestions or introduce a remote search service.

### DB-07: Structural validity and presentation readiness are conflated in the specification (Priority 2)

**Evidence:** a new song with empty lyric strings passes validateContent because it has a structurally valid section/page/default arrangement. Section pages must be nonempty arrays, but their text can be empty. IDs are unique among nested sections/pages/arrangements within each Content; the validator does not seed that set with the root ID. Some labels/titles/collections have no explicit per-field/count bound beyond backup file limits.

**Effect:** Saving an empty working song is possible; that is not automatically a storage bug. The interface specification currently describes usable lyrics as a basic save requirement without defining drafts versus media-only content. Arbitrary blanket rejection could break valid media-backed slides and existing backups.

**Recommendation:** Separate structural storage validation from readiness checks. Permit a documented working-song state, but flag all-empty active lyrics before projection unless an intentional supported media-only slide is present. Define whether identity uniqueness is per type or across a whole aggregate, then test it. Add reasonable count/length bounds only with compatibility analysis and actionable errors; retain existing bounds on lyric text and archive sizes.

## 4. Recommended direction and migration sequence

1. Keep current aggregate storage. Write model invariants and focused regression tests for DB-01–03 before implementing section navigation.
2. Audit synthetic converter fixtures and legacy backup versions against stricter hierarchy/auto rules. Produce a loss-preserving compatibility policy before enabling stricter restore rejection.
3. Add revision-aware repository create/update/delete APIs in a schema increment. Remove direct mutation paths from UI operations when these contracts are introduced. Migrate existing records with an explicit initial revision; retain UUIDs and exact content.
4. Implement source-baseline metadata only alongside explicit comparison/refresh UI. Keep existing services as historical independent copies.
5. Measure search and storage cost. Optimise derived search before splitting the aggregate or duplicating blobs.
6. Extend backup validation/versioning and round-trip tests for new persisted fields. Older readers must not silently discard concurrency/source semantics. None of these changes should affect live-state restoration or permit automatic reveal.

Contributor normalisation, many-language translation entities, historical usage/reporting tables and Trash are separate future requirements. The current author/copyright/tags strings and paired text channels should not be described as a complete publication catalogue, revision history or multilingual translation database. Avoid designing those features before defining their actual workflow.

## 5. Verification performed

- Read model.ts, repository.ts, relevant Library.tsx mutations/search, backup validation/export and existing model/repository tests.
- Executed synthetic, in-memory model probes: duplicate occurrence IDs; accepted mixed hierarchies; inconsistent auto arrangement; empty lyric acceptance. No IndexedDB user data was touched.
- Ran repository.test.ts and design.test.ts: **18 tests passed across two files**. Existing passing tests do not cover every finding above.
- No application source, database schema, UI specification or production deployment changed. This review recommends fixes; it does not implement them.
