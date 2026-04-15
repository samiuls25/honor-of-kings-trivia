# Raw Capture Input

Place your exported Honor of Kings skin capture file here.

Supported input formats:
- `hok-skins-capture.har` (recommended)
- `hok-skins-capture.json`

Suggested flow:
1. Open the official skin page in browser.
2. Open DevTools Network tab and filter by `fetch`/`xhr`.
3. Reload page and scroll so hero/skin data loads.
4. Export network as HAR.
5. Save as `data/raw/hok-skins-capture.har`.
