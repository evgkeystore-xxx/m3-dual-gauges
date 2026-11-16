# BMW M3 M Control 2.6 — trzy aplikacje do MGU Store / iDrive 8

## Zawartość
- `apps/ks_pops_controller` — Pops Controller 2.6.0
- `apps/m3_dual_gauges` — M3 Dual Gauges 0.7.6
- `apps/ks_m3_cockpit` — M3 Cockpit Studio 1.4.6
- `assets/icons/` — PNG o rozmiarze maksymalnie 256×256, w tym trójkolorowe logo M
- `tools/`, `packages/` — manifesty i narzędzie diagnostyczne poprzedniego zestawu

## Poprawki
- POPS po lewej, Flame Mode po prawej tylko dla Sport+ i P/N; w Sport oraz Comfort panel Flame jest ukryty
- Flame Mode: ON/OFF i dokładnie trzy suwaki (długość, moc, opóźnienie) z oznaczonym wizualnie zakresem zielony–pomarańczowy–czerwony
- Podświetlony zakres RPM w całości zielony
- Parametry LIVE w jednej pionowej kolumnie
- Kamera: tylko powierzchnia obrazu, osobny panel parametrów i małe X; bez menu trybów, napisu Pops Studio i paska LIVE / RPM / BŁĘDY
- W kamerze nie ma rzeczywistego obrazu, ponieważ nie zidentyfikowano potwierdzonego dostępu do strumienia OEM; komunikat o braku obrazu jest celowy
- Diagnostyka: pełna szerokość, stronicowanie i przełącznik PEŁNY DEBUG z 5 kolumnami wpisów logów (bez powtórzeń wskaźników silnika)
- Wybór oznaczenia modelu BMW (wyłącznie nazwa w interfejsie, bez kodowania auta)
- Pops Studio -> Pops Controller

## Bezpieczeństwo
Żadna z tych zmian nie flashuje ani nie odczytuje do kopii mapy MHD; istniejąca pojedyncza mapa ~700 KM pozostaje nienaruszona. Profile Pops i Flame Mode są lokalne, nie sterują zapłonem ani płomieniami. Kopia to kopia ustawień aplikacji, a nie ECU. Czerwone pola suwaków są jedynie poglądowym oznaczeniem poziomu nastawy, nie skalibrowanym ryzykiem uszkodzenia silnika.

## Instalacja przez GitHub
Rozpakuj zawartość ZIP do głównego katalogu repozytorium i zatwierdź zmiany na gałęzi `main`. Nie wgrywaj ZIP-a jako pojedynczego pliku. Usuń stare wersje plików `.tgz` z katalogów aplikacji. Odśwież źródło w MGU Store. Najpierw testuj na postoju.

## Testy
Wykonano testy lokalne z zastępczymi odczytami: uruchomienie widoku, nawigacja, ukrycie Flame w Sport, brak dolnych pasków w kamerze, panel pięciu kolumn i wybór auta. Nie przeprowadzono testów na fizycznym BMW; dostęp do kamery OEM pozostaje niepotwierdzony. Podgląd HTML to oddzielny plik poza ZIP-em.
