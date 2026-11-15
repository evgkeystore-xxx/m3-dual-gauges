# M3 Dual Gauges 0.3.0 — BMW MGU / iDrive 8

This is an experimental rebuild against the supplied `car-apps-main (1)(1).zip` reference package.
The reference apps compared were Car Data, Drag Timer, Service, eDrive, Ambient Light, Seats, and DTC Scanner.
The original Car Data OnlineApp lifecycle (`online-host.js`) and RHMI runtime/resources are preserved.
The dashboard view has two gauges; live RPM/speed readings are read-only and display -- without a valid signal.

## Upload
Upload all files and folders in this ZIP to the ROOT of the existing GitHub repository, preserving `apps/m3_dual_gauges`.
Check the Store reports available version `0.3.0` (not `0.2.2`).
Don't delete any other car apps. Test parked. If opening still fails, collect process/application journal; updater success alone is not proof of launch.

## Caveat
Static checks can be completed here, but launch cannot be verified on the MGU itself.
Reference implementation from supplied IterioDev car-apps, governed by upstream licenses.
