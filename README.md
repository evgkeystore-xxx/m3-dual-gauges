# BMW M3 G80 — two independent OAP apps, revised packages

Both apps preserve original IDs, visual assets, UI behavior and demo-only status. The source package layout is now aligned with the working M3 Dual Gauges deployment format. No ECU tuning, exhaust/fire control, camera access, cluster replacement, or live power adjustment is provided.

## GitHub
Upload the CONTENTS of this archive to the ROOT of your existing public repository, or use a separate repo. In MGU Store add the owner/repo branch main. Install **Pops Controller 1.3.6** and **M3 Cockpit Studio 1.0.6**.

## USB
In each apps/<id>/ folder there is a TGZ source package. A separate USB folder in the downloadable combined archive provides these packages. The original third-party packages were not guaranteed to launch; successful build is different from successful on-device launch.

## Changes
- Both `mgu-app.json` files now use a version directory as `tree`.
- Package metadata and application assets are flattened to the correct version-directory root.
- Every JS source module is present in both source locations, and listed in the right order.
- Source imports now resolve to adjacent modules without changing visuals or configured UI routes.
- Original app IDs and RHMI application UUIDs preserved.
- Uses installed `mgu-render` service; running from store depends on MGU firmware and renderer version.

Test while parked. No guarantees of live ECU connection or reliable start on the actual head unit without on-device verification.
