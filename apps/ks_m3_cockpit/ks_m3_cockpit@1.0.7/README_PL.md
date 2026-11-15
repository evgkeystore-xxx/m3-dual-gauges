# M3 Competition Cockpit Studio 1.0.0 — iDrive 8

## Co jest zaimplementowane
- Natywna aplikacja OAP w menu All Apps: wybór 12 oryginalnych motywów i prosta symulacja RPM.
- Lokalny zapis: motyw, włącz/wyłącz, DEMO, miganie po 7000 RPM, reset ustawień (wymaga 2 kliknięć).
- Integracyjny klient `cluster-render/1` dla opcjonalnego WIDŻETU iDrive 8 w centralnej części zegarów (`target=widget`).
- Widget domyślnie WYŁĄCZONY przy każdym uruchomieniu, dopóki kierowca nie zdecyduje się go ręcznie pokazać na postoju.
- Widżet to statyczne grafiki demo z dodatkowym podświetleniem RPM symulowanego, z oznaczeniem `DEMO - NIE SA TO DANE Z BMW`.

## Czego NIE ma
- Brak zweryfikowanego odczytu live RPM, prędkości, mocy, biegów z ECU; symulacja nie jest pomiarem.
- Brak przejmowania całego fabrycznego licznika i nie ma nadpisywania wskaźników, kontrolek oraz ostrzeżeń BMW.
- Nie sprawdzono na rzeczywistym BMW G80 2024, zwłaszcza działania HMI, widżetu, uprawnień i opóźnień.
- Nie jest to 60 FPS na zegarach: HTML renderuje płynnie w przeglądarce, natywne GPU jest ustawione na limit 24 FPS, a static graphics widget nie są animowanym całym licznikiem.

## Czego potrzeba, by spróbować instalacji
1. Zgodnej z samochodem i legalnie odblokowanej jednostki MGU / SSH (odblokowany DME MHD nie wystarcza).
2. MGU Store i mgu-render z oficjalnego repozytorium autora.
3. Do wyświetlania opcjonalnego widżetu: `cluster-render` z `robertnisipeanu/idrive-apps` (testy wykonywać na postoju).
4. W MGU Store: USB → M3 Cockpit Studio → Install, po zapoznaniu się z ograniczeniami; restart jednostki gdy wymagany.

### Kontrola OFF / Reset
- Otwórz aplikację, dotknij USTAWIENIA.
- Wiersz `Wizualizacja`: włącza i wyłącza projekt aplikacji; fabryczne zegary nie są modyfikowane.
- Wiersz `Widżet przed kierowcą`: ręczne uruchomienie na postoju (przy zainstalowanym cluster-render).
- Wiersz `Sygnal 7000 RPM`: zmiana migania.
- `Przywróć domyślne`: dotknij dwa razy w czasie 4 sekund; zatrzymuje widget i przywraca ustawienia.

## Po co ograniczenie do widżetu?
W aktualnym `cluster-render` target `panel` NIE istnieje dla ID8. Dostępny jest m.in. `widget` (2240 x 896 canvas), lecz fizycznie widoczne jest znacznie mniejsze pole na środku zegarów. Rozmiar grafiki dostosowany do dokumentacji 1140 x 480, x=550, y=220. Nie należy używać jej zamiast prędkościomierza.

Źródła techniczne:
https://github.com/robertnisipeanu/idrive-apps/tree/main/native/cluster-render
https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md

## Licencje i zasoby
Autorskie grafiki wygenerowane dla tego projektu. Kod projektu — GPL-3.0-or-later; plik render client wykorzystuje zgodną licencję z projektu mgu-render. BMW oraz M3 są znakami odpowiednich właścicieli; projekt nie jest oficjalny.
