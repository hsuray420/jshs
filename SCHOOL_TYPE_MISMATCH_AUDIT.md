# School Type Mismatch Audit

This audit is retired for the current school-discovery runtime.

The previous mismatch report compared a manually maintained national entity CSV
against a separate admission-relation CSV. That two-file contract has been
removed. The current runtime reads the enabled regional CSV rows directly and
preserves each row's `學制分類`, `招生區`, `科系與名額`, and source metadata in
`admissionRecords[].raw`.

Cross-region repeated school codes are aggregated into one school entity keyed by
`學校代碼`; the original regional rows remain available as admission records and
are not overwritten by a separate master entity file.
