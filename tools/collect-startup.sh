#!/bin/sh
# Read-only diagnostics, run on the MGU through an existing SSH connection.
# This script does NOT install, restart, flash, clear faults or change settings.
set -u
printf '%s\n' '=== M3 SUITE STARTUP / RENDERER ==='
journalctl -b --since '10 minutes ago' --no-pager -o short-iso 2>&1 | grep -iE 'M3SUITE|m3_dual_gauges|ks_pops_controller|ks_m3_cockpit|mgu-render|oapcontroller|exception|failed'
printf '%s\n' '=== PER-APPLICATION FILES ==='
for d in /var/opt/public/oap/oap_*; do
  [ -f "$d/source/package.json" ] || continue
  grep -Eq '"name"[[:space:]]*:[[:space:]]*"(m3_dual_gauges|ks_pops_controller|ks_m3_cockpit)"' "$d/source/package.json" || continue
  printf '\n%s\n' "$d"
  for f in "$d/data/m3-boot.log" "$d/data/m3-status.json"; do
    [ -f "$f" ] && { printf '\n%s\n' "$f"; cat "$f"; }
  done
done
