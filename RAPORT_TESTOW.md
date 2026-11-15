# Raport kontroli lokalnej — M3 Suite

Data: 15 listopada 2026 r.

**To nie jest raport z samochodu.** Testy używały Node 22.16.0, rzeczywistego kodu referencyjnego hosta/renderera i zamockowanych transportów BMW oraz socketu renderera. Nie było lokalnego SDK BMW ani wykonania na MGU; finalne wiązanie SDK wykonuje instalator na jednostce.

## Wyniki

- 65 testów funkcjonalnych / startu: PASS. Sekwencja rzeczywistego hosta `init → mapEntryState → ENABLED → openEntryState`, otwieranie sześciu stron każdej aplikacji, odczyty z mocka, zapis kopii, ograniczenie ECU, przełączanie 12 motywów.
- 10 testów rzeczywistego lokalnego serwera HTTP z testowym katalogiem instalacji: PASS. Statusy, pełny tekst błędów, kopie, blokada POST, brak endpointu flashowania, ochrona nazwy pobieranego pliku.
- 84 warianty ekranów zarejestrowane przez rzeczywisty renderer: PASS, bez błędów widgetów. Pozycje elementów sprawdzone względem Y=76…840.
- 5 lokalnych obrazów PNG: rzeczywisty zakres nieprzezroczystych pikseli Y=76…839. Nie rysują na górnym pasku ani klimatyzacji.
- Odrzucenie `null`, `undefined` i tekstu w polach liczbowych z magistrali: PASS. Wartości te nie stają się fałszywym zerem.
- Kontrole manifestów, wersji, UUID, modułów, drzew pakietów, zasobów RHMI oraz sum USB: PASS.

- Kontrola składni 65 plików JavaScript: PASS w Node 22.16.0. Nie jest to test wykonania na Node 8.16.2 jednostki. Kod produkcyjny korzysta z mechanizmu i składni referencyjnych aplikacji.

## Rozmiary właściwych pakietów aplikacji

| Identyfikator | Wersja | TGZ, bajty | Rozpakowane pliki, bajty | Plików źródłowych |
|---|---|---:|---:|---:|
| `m3_dual_gauges` | 0.4.0 | 160099 | 414926 | 45 |
| `ks_pops_controller` | 1.4.0 | 146835 | 403074 | 45 |
| `ks_m3_cockpit` | 1.1.0 | 161442 | 416163 | 45 |

Wszystkie trzy są poniżej 64 MiB zarówno skompresowane, jak i rozpakowane. Rozmiary nie obejmują SDK dobieranego na samochodzie. Oryginalne duże bitmapy/duplikaty zastąpiono ekranami wektorowymi; nie rozsyłamy BMW SDK ani fontów.

## Granice wyniku

Nie potwierdzono na fizycznej jednostce: uruchomienia nowej wersji, polityk SOME/IP, dostępności poszczególnych PID-ów, fizycznego dotyku ani dostępu telefonu do portu 8484. Brak testu sprzętowego nie jest maskowany etykietą „zainstalowano”.

Sterowanie strzałami/Flame, zapis mapy, przełączanie map, pełna kopia DME, kamera OEM, dźwięki silnika z głośników i zastąpienie fabrycznego zestawu wskaźników pozostają niedostępne. Zmiany profili w Pops są lokalne i oznaczone jako DEMO sterowania. Odczyty mogą pracować LIVE niezależnie od tej blokady.

Szczegółowe nazwy wykonanych testów znajdują się w katalogu `testy`. Dalszy wynik testu w aucie powinien być oceniony na podstawie własnych plików startowych i raportu portu 8484, nie tylko logów instalatora.
