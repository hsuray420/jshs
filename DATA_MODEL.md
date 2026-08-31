# Data model — Official Data Foundation

## Academic-year boundary

Every year-sensitive record has `schoolYear`, `dataSchoolYear`, and `yearStatus`. A record where these years differ is valid only with `yearStatus: previous_year_reference`; otherwise the import validator stops the build with `YEAR_MASQUERADE`.

## Core contracts

`SourceRegistryRecord`: `id`, `dataset`, `district`, `schoolYear`, `issuer`, `sourceUrl`, `sourceType`, `ingestionMode`, `status`, `retrievedAt`, `lastCheckedAt`, `verifiedAt`, and optional `snapshot` (`contentHash`, type, bytes).

`OfficialInformationRecord`: `id`, title, issuer, district, year fields, dates, `type`, `sourceId`, URL, source type and summary. A portal is `type: platform`, never an announcement.

`AdmissionHistoryRecord`: school/program IDs and names, year fields, `recordType`, `metricType`, value/label, source fields, retrieval/verification dates and status. Official records require an official source and official metric; community records use `community_reference`.

`VocationalGroupRecord`: formal group ID/name and mapped department name, source ID/type, status, and nullable curriculum-detail fields. Null means the source has not been ingested, not generated content.

## Validation gates

Fatal: unknown district/school/program, duplicate ID, missing registry source, missing official history source URL, official/community metric mismatch, invalid dates, and year masquerading. Warnings include a changed source snapshot hash. Run `pnpm run validate:data-foundation`.
