# FloorPlanGeoProvider — Point 6 boundary

Runtime: `js/geo-provider.js`, pure UMD, no network/storage/renderer. The implemented provider is `FloorPlanGeoProvider.Manual`. It is permanent and works offline in every country.

`Manual.capabilities` declares `coordinates` and `sourceMetadata` true; search, parcel, geometry, orthophoto, elevation and terrain false. No UI action is offered for unsupported operations.

`Manual.getCoordinates({latitude,longitude,timeZone})` accepts finite numeric WGS84 degrees and an IANA zone recognized by Intl. It returns `{status:'available',location:{latitude,longitude,timeZone,source:{providerId:'manual',type:'user-entered'}}}` or `{status:'unavailable',reason:'coordinates'|'timeZone'}`. It does not convert empty text into 0, accept raw API responses, or retain unrelated input fields. Explicit 0/0 is valid input, never a fallback. `Manual.getSourceMetadata()` returns that same minimal provenance.

The solar core accepts only normalized coordinates/time zone/north/date/time. It has no provider identity branch or network call. A future territorial adapter can implement search/getParcel/getGeometry/getCoordinates/getSourceMetadata according to honest capabilities and return the same normalized location with minimized provenance. Unsupported operations remain absent, not fake successful empty responses. External adapters must add normalized not-found/unavailable/invalid/cancelled results, timeout and cancellation, preserve an existing valid project on error, and pass shared provider contract tests before activation.

Spain is the first future territorial provider: Catastro for parcel/reference/geometry, IGN/CNIG/PNOA for context/orthophoto/elevation when Exterior V3 requires them. There is no active territorial endpoint in this cut. Endpoint conditions, attribution, coverage, CRS, license and redistributability must be reviewed before adding an adapter. No owner identity, NIF/CIF or cadastral value.

Future source geometry retains source ID, provider, CRS, retrieval time, endpoint/version/license where applicable. An editable working geometry is a separate derived representation referencing the source, never a rewrite of official source data. This does not add terrain, parcel geometry or any Exterior feature now. Point 8 V1/V2/V3 keeps its approved scope.

`site.location.source` can retain `providerId`, `type` (`user-entered`, `official-source`, `derived`, `unknown`), `sourceName`, `sourceUrl`, `sourceId`, `retrievedAt`, `version`, `derivedFrom`. Manual input stores only the first two. Publication remains independent: geographic data is internal and is not automatically added to client images/sheets/video. Editable project/building JSON and ZIP retain it.

Solar local-time conversion uses IANA rules, accepts 1900–2150 and rejects missing, invalid, nonexistent and ambiguous local times. The latter two ask the professional to choose another time; V1 has no DST fold selector. SunCalc remains an indicative visualization, not a measurement or regulatory study. The independent reference fixture is [NREL SPA, Appendix A](https://docs.nlr.gov/docs/fy08osti/34302.pdf), with 0.5° product tolerance and the documented 30-second input difference. No NREL implementation code is incorporated.
