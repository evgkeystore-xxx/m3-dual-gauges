# BMW M3 – Pops Controller 2.7.0 / MGU Store

Zestaw zawiera aktualizację `ks_pops_controller@2.7.0.tgz`, pozostałe dwie aplikacje (M3 Dual Gauges 0.7.6 / M3 Cockpit Studio 1.4.6), katalog `tools` oraz informacje licencyjne.

**Jest to natywna aplikacja MGU, nie strona HTML ze zrzutem ekranu jako tłem.** Interfejs w `package/renderer/runtime/ui27.js` rysuje osobne elementy renderera i obsługuje zdarzenia dotyku. `DESIGN_SOURCE/popscontrol` to oryginalna strona HTML przesłana przez użytkownika, zachowana wyłącznie jako źródło wizualne.

Zachowano lokalne profile Pops / Flame, telemetrię, diagnostykę, licencje upstream i brak funkcji flashowania mapy. Obsługa kamery OEM nie jest zweryfikowana.

1. Rozpakuj ZIP. 2. Wgraj jego zawartość do głównego katalogu repozytorium GitHub, nie sam plik ZIP. 3. Zatwierdź `main`. 4. Odśwież źródło w MGU Store i wybierz Pops Controller 2.7.0.

Zobacz `README_27.md`, `TEST_27.md`.
