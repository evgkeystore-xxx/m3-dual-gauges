# Third-party code and provenance

The new M3 Suite host, main module, runtime controllers, transport policy,
telemetry adapter, views, icons, diagnostic companion, build script and tests
are provided under the root MIT license.

`SOURCE/kit/canvas.js`, `record.js` and `renderd.js` are drawing/protocol code
from the MIT-licensed renderer kit in the owner-supplied `car-apps-main (1)(1).zip`,
as also present in the previously installed M3 Dual Gauges 0.3.4.
The upstream kit's `LICENSE`, `NOTICE` and `SOURCE` are preserved verbatim in
`SOURCE/kit/` and inside each app's `package/renderer/kit/` in the installation TGZ.
Those historical notices describe additional files in the original distribution;
not all those files are included in this subset. The only included upstream JS
files are the three explicitly listed above.

`SOURCE/kit/fonts.js` contains rasterized, compressed alpha pixels for the UI,
baked from Inter Display (SIL Open Font License 1.1) on the build computer.
It does not contain or distribute a font file (TTF/OTF), nor use BMW font assets.
Typeface: https://github.com/rsms/inter (OFL-1.1). No BMW SDK, firmware,
engine map or unlock data are redistributed here.

The source package links BMW's SDK from a stock donor already on the head unit.
The OnlineApp/RHMI lifecycle, data field names and TASU framing were checked
against the owner's working reference. The new host is not a renamed copy of
IterioDev's online-host.js or of its full Car Data/Live Adjustments app.

The reference repository's original LICENSE.md is retained for provenance as
`DOCS/REFERENCE_LICENSE.md`. Its PolyForm Strict terms for other parts are NOT
a permission to redistribute a rebranded copy of those parts. Those proprietary
app implementations and original private car-font/icon resources are omitted.

Upstream locations:
- https://github.com/IterioDev/car-apps
- https://github.com/cauliflowermossgrape/idrive7-apps
- https://github.com/robertnisipeanu/mgu-store
