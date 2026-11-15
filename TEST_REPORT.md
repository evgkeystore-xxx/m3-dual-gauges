# BMW M3 G80 — raport wydania M Control

Data wydania: 15 listopada 2026. To **test lokalny**, nie potwierdzenie działania na fizycznym BMW.

## Wersje i wyniki

- M3 Dual Gauges: **0.5.0**
- Pops Controller: **1.5.0**
- M3 Cockpit Studio: **1.2.0**
- Testy logiki i protokołu: **31 zaliczonych, 0 niezaliczonych**
- Dotyk: symulowany serwer przesłał przez socket pełny pakiet TOUCH, przycisk przełączył profil mimo utraty fokusu RHMI.
- Rysowanie: przejrzyste 0–75 i 840–959, obszar 2880×960 projektowy.
- Przyciski, suwaki, motywy i nawigacja: zweryfikowane w testach fixture.
- ECU: testy odrzucają flashowanie, przełączanie slotów map oraz niesprawdzone komendy burble.

## Rozmiary pakietów

| Nazwa | TGZ (bajty) | Po rozpakowaniu (bajty) |
|---|---:|---:|
| m3_dual_gauges | 223 484 | 363 827 |
| ks_pops_controller | 216 597 | 356 978 |
| ks_m3_cockpit | 215 855 | 356 172 |
| m3-suite-diagnostics | 5 471 | 11 436 |

## Ograniczenia

Przekazania dotyku przez rzeczywisty renderer MGU, aktywnego firmware oraz faktycznego położenia klapy nie da się zweryfikować bez testu w aucie. Jeśli wskaźnik `DOTYK` pozostanie na 0 po fizycznym naciśnięciu, odczytaj `touchAdvertised`, `rendererSocket`, `touchEvents` i log `mgu-render` przed kolejnym flashowaniem albo zmianą aplikacji.

Nie udajemy prawdziwej regulacji pops MHD: profile są lokalnym DEMO; kopia dotyczy wyłącznie ustawień aplikacji, nie ECU. Kolorowe ekrany w `DOCS/PREVIEW` przedstawiają podgląd na danych demonstracyjnych.

## Lista testów

1. PASS — Policy: allows only eight diagnostic Mode-01 PIDs
2. PASS — Policy: all non-read/non-flap services blocked, including ECU programming/reset/security/map writes
3. PASS — Policy: MHD map-switch 2F01, maxcool 2F03 and MG burble 2E6946 are blocked
4. PASS — Policy: flap allowed only in Pops with confirmation, fresh real parked speed, not DEMO
5. PASS — Policy: release an owned flap override permitted; cannot use release flag to open/close
6. PASS — TASU: exact byte framing and RPM 900 / speed zero decoding
7. PASS — TASU: exact MHD flap acknowledgement and separate readback
8. PASS — TASU: negative DME response retains NRC and raw command
9. PASS — TASU: protected service never reaches sendTasuRequest
10. PASS — TASU: readback failure is not reported as a confirmed physical flap position
11. PASS — TASU: stale speed at transmit is rejected even if it was fresh before connecting
12. PASS — TASU: truncated negative response is reported, not an uncaught exception
13. PASS — Telemetry: zero is a real reading, not a disconnected state
14. PASS — Telemetry: partial data never filled with simulated vehicle values
15. PASS — Telemetry: no data waits before DEMO; disabled DEMO shows OFFLINE
16. PASS — Telemetry: real signal returns immediately from DEMO
17. PASS — Telemetry: stale signals are unavailable and computed power uses only fresh real inputs
18. PASS — Telemetry: SOME/IP fixtures decode factor/offset and reject sentinel
19. PASS — Settings: backup marked NOT ECU; before-change backup restores previous value
20. PASS — Diagnostics: full error stack saved, credentials scrubbed
21. PASS — Views: all pages and 12 themes render; touch targets stay clear of native bars
22. PASS — Views: raster preview has transparent top 76 / bottom 120 design rows
23. PASS — Host: OnlineApp initialized -> state/resources -> entry mapping -> opened -> repeat tile tap
24. PASS — Host: missing entrypoint creates full start error rather than silently accepting
25. PASS — Bootstrap: SDK load failure is recorded to the app data directory before host construction
26. PASS — Renderer: compatibility HELLO/READY/FRAME, three apps, reopen and climate-safe claims
27. PASS — Touch: DOWN-only renderer taps switch pages; UP-only taps also work
28. PASS — Touch: sliders change local demo profiles via DOWN/MOVE/UP, never call ECU
29. PASS — Touch: E_TOUCH wire protocol parses phase and floating-point coordinates
30. PASS — Diagnostics HTTP: app discovery, full report, stale status, path/origin protection
31. PASS — Integration: actual renderer TOUCH packet activates a button after RHMI focus=false
