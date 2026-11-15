# M3 Dual Gauges 0.3.2 (test build)

Fix for `mgu-app.json: modules must name the app's .js files, the entry first`.

Source modules are now in `apps/m3_dual_gauges/src/` **next to** `mgu-app.json`, as required for the repo-tree source build. The staged OAP tree lives separately in `apps/m3_dual_gauges/m3_dual_gauges@0.3.2/`.

Update your GitHub `main` branch by uploading the contents of this ZIP to the root, retaining relative paths. Check Store offers 0.3.2. This fixes source layout validation but does not prove runtime startup or live vehicle data. Test while parked.
