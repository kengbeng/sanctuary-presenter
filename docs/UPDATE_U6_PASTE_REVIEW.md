# U6.3: Whole-song paste staging and service review

17 October 2026. Local implementation; not deployed.

## Paste lyrics

The song editor in Library and Create song now has an optional Paste whole-song lyrics disclosure. A full line such as [Verse 1] marks a section; a line containing exactly --- marks another slide. These reserved markers are explicit author instructions. Blank lines remain inside a slide; ordinary lyrics are not guessed into sections. Text before the first section marker, repeated section labels, empty public slides and overlong slides receive actionable errors. Use Song order for repeats after pasting.

A second-language staging field is optional. It requires matching section labels and page counts; the app does not translate or automatically align either channel. A page can contain only the second language when its primary marker structure is explicit. Original punctuation, Unicode and deliberate line breaks are retained; native textarea line endings are normalized to LF.

Preview shows the section labels and both text channels for each page before Apply. Cancel discards only staging. Apply appends fresh sections and page IDs without replacing existing words or custom orders. A single untouched, default empty starter section is replaced; customized empty starter designs are retained. Existing section-name collisions receive visible pasted-copy names in the preview. Automatic arrangements include the new sections; custom arrangements remain unchanged. A changed song invalidates the staged preview and requires Preview again.

Apply updates the working song, not the database or output. Normal Save or Save song and add to service remains explicit. Those save actions are disabled while unapplied pasted text exists, and the disclosure says staged, not applied. Existing unsaved-change warnings also cover staged text. Staging is in memory; browser-restart draft recovery is not implemented. Legacy originals requiring recovery do not offer the paste tool until an editable copy is created.

## Read-only review

Prepare offers Review service after its save queue settles. Review opens a read-only snapshot of the saved working service: running order, each arranged page including repeated sections, public preview, private notes and non-presenting headings. Previous/Next visits this review sequence only. Editing fields, Take and output-start controls are absent from review.

Edit this item returns to the exact service item/page in Prepare. Back to preparation and the Prepare tab return to normal preparation. Changes saved elsewhere are identified without silently replacing the reviewed snapshot. Review navigation does not change saved records or congregation output; the persistent output strip retains Return to presentation, Blank and End during an active session. Physical placement and live readability still require projector rehearsal.

The desktop review fits the full slide into its preview area. Compact layouts scroll the review content with sticky review navigation and the existing persistent output controls. Private notes and Edit share a compact row. Technical render metrics and stale preparation success messages are hidden from this focused workflow.

## Evidence and remaining work

Five new unit cases verify explicit parsing, bilingual alignment, empty/error boundaries, preservation of original text, safe starter replacement, independent append identities, custom-order preservation, long-slide rejection and retention of customized starter designs. Two browser workflows verify cancellation, save gating, stale-preview rejection, bilingual persistence, read-only service-record equality, headings, exact edit return, live-output isolation, Blank and review layout at desktop/compact sizes. Detailed final results are recorded in VERIFICATION.md. Screenshot: service-review-preview.png.

No schema/archive/protocol change or backend was introduced. Source comparison and explicit refresh remain the next U6 increment. Physical Safari/second-display, screen-reader and participant checks, production publication and final release acceptance remain outstanding.
