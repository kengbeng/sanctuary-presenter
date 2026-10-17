# U6.1: Find the right song

17 October 2026. Local implementation; not deployed.

Library and Prepare now share search normalization. Matching ignores case, accents, punctuation and repeated whitespace; all entered terms must match, in any order, across title, text song number, author, tags and both lyric channels. Chinese substring matching remains available. Song numbers remain strings and original text is unchanged. Only the content's canonical visible lyric branch is indexed, so preserved hidden legacy branches do not mislead search.

Both entry points offer language and tag filters and matching lyric excerpts. Language matches either declared channel; it is metadata filtering, not automatic language detection. Tags use comma, semicolon or newline separators and retain multiword names. Filters reset when switching content categories and can be cleared explicitly. Excerpts retain original case, punctuation and Unicode words, including long-line matches. Empty results distinguish no matches from an empty library.

Creating/editing a record shows a non-blocking possible-duplicate notice when another same-kind record has an equal normalized title or equal first lyric line of at least 12 normalized characters. Up to three existing titles are shown. This is a conservative suggestion, not fuzzy identity matching, merging or a save restriction. Separate records and their independent service copies remain intact.

The index is derived in memory from local records and memoized between changes. No persisted search store, schema/archive change, external search service or network request was added. A local Node synthetic benchmark with 5,000 songs and approximately 1,800 characters per song took about 95 ms to build and 31 ms to query before the small duplicate-key caching refinement. These are one-machine diagnostic measurements, not latency guarantees; a real-library browser benchmark remains useful before further indexing work.

Verification: five new unit cases cover normalization, conjunctive matching, bilingual/text-number search, exact language/tag filters, original-text preservation, possible duplicates, a 5,000-record lookup and long Unicode excerpts. Browser acceptance covers both entry points, empty-result recovery, filters, matching lyric excerpts and saving a suggested duplicate as a distinct record. Final suite results are in VERIFICATION.md. The synthetic UI example is song-search-preview.png.

Remaining U6 work: section/page duplication and movement, whole-song paste staging, read-only running-order review and explicit source comparison/refresh. Human workflow and physical display acceptance remain outstanding. Production is unchanged.
