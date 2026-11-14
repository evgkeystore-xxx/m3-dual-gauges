M3 Dual Gauges 0.2.1 - FIX build failure on 0.2.0.
Upload both files from this ZIP to root of GitHub repository. No extra directories.
The startup host code is now INLINED in src/main.js, fixing cannot build: requires ./online-host not an app module.
Version 0.2.1 triggers upgrade instead of already-installed.
This is still UNTESTED on vehicle; renderer and real RPM/speed access must be confirmed after install.
