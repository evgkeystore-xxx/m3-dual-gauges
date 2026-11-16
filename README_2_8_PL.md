# BMW M3 Pops Controller — wersja 2.8.0

Paczka do wgrania do istniejącego repozytorium `evgkeystore-xxx/m3-dual-gauges`, gałąź `main`.
Prześlij zawartość archiwum, a nie sam ZIP. W MGU Store odśwież źródło i wybierz aktualizację `ks_pops_controller@2.8.0`.

## Co zmieniono
- Przebudowany natywny interfejs. Nie ma pełnoekranowego zdjęcia udającego aplikację.
- Lepsze wtopienie oryginalnych grafik wydechu i płomienia (oddzielne półprzezroczyste obrazy).
- Ekran kamery: zdjęcie parkingu jako **DEMO** przy niedostępnym strumieniu OEM; nie jest to obraz z samochodu.
- Widok danych LIVE — brak sygnału to `--`, nie sztuczne 0. `DANE CZĘŚCIOWE` przy niepełnych danych.
- Ograniczona częstotliwość rysowania przy dotyku; obsługa wyjątków renderera.
- Ograniczenie ponawianych błędnych żądań OBD, brak automatycznego odpytywania klapy co 3 sekundy.
- Mniejsza liczba zapisów logów przy ruchu palca.
- Diagnostyka pełna w pięciu kolumnach z numerami stron.

## Granice funkcjonalne
- Zapisane profile Pops/Flame są lokalnymi nastawami UI. **Nie ma weryfikowanego API zmiany burble/Flame w MHD.**
- Brak potwierdzonego interfejsu OEM kamery. W tej wersji nie uzyskano rzeczywistego wideo.
- Nie odczytano mapy ECU; przycisk kopii oznacza wyłącznie kopię ustawień aplikacji.
- Aplikacja nie flashuje ECU i nie przełącza map.
- Testy wykonane lokalnie z symulowanymi źródłami MGU; nie testowano na samochodzie.

## Diagnostyka
W Ustawieniach otwórz Diagnostykę i sprawdź komunikaty:
`OBD_BUSY`, `TASU_CONNECT`, `CDS_CONNECT`, `CAMERA_OEM_UNAVAILABLE`, `RENDER_FRAME_RECOVERED`.
Jeśli dane silnika nie płyną, nie zwiększaj częstotliwości OBD ręcznie. W szczególności
`APP_REQUEST_TEMPORARILY_NOT_ACCEPTED` wskazuje, że system odmówił obsługi żądania w tej chwili.

Instalacja i testy tylko na postoju. Zewnętrzna diagnostyka nie zastępuje narzędzia BMW.
