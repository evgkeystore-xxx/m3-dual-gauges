# Raport weryfikacji M Control 2.6

- Składnia JavaScript nowych modułów sprawdzona (`node --check`).
- Lokalny test 9 przypadków `View.draw`: 4 tryby jazdy, trzy suwaki Flame, widok kamery, dwa tryby błędów, wybór auta — PASS.
- Archiwa TGZ zawierają manifest, moduły źródłowe, wszystkie pliki PNG i licencje kit.
- Każdy PNG ma maksymalnie 256 px na dłuższym boku.
- Każda paczka instalacyjna TGZ jest poniżej 64 MiB.
- Interaktywny HTML: parser JavaScript PASS; pełny automatyczny test mobilnego Safari i test jednostki MGU nie został wykonany.
- Kamera OEM: niezintegrowana, brak potwierdzonego źródła klatek; komunikat zamiast symulacji.
- MHD: brak flash/map-switch; sterowanie Pops/Flame niepodłączone do ECU.
