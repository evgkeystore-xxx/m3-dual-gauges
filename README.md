# BMW M3 — kompletny zestaw trzech aplikacji

Wydanie przygotowane 15 listopada 2026 r. dla istniejącego MGU Store / iDrive 8. Podstawa uruchamiania: działający u użytkownika M3 Dual Gauges 0.3.4 i dostarczony Car Data 1.4.1. Nie jest to oficjalny produkt BMW, MHD ani IterioDev.

| Aplikacja | Identyfikator | Wersja |
|---|---|---|
| M3 Dual Gauges | `m3_dual_gauges` | **0.4.0** |
| Pops Controller | `ks_pops_controller` | **1.4.0** |
| M3 Cockpit Studio | `ks_m3_cockpit` | **1.1.0** |

`M3 Diagnostics 1.0.0` jest dodatkową usługą techniczną, a nie czwartą aplikacją na ekranie samochodu.

## Najważniejsze: mapa MHD 700 KM

Kod tego zestawu nie zawiera operacji flashowania DME, zapisu kalibracji, przełączania map, resetowania adaptacji ani kasowania błędów silnika. Odczyt pojazdu wykorzystuje gettery SOME/IP oraz jawnie ograniczone zapytania OBD **service 01**. Przyciski aplikacji nie mogą podać innego numeru usługi diagnostycznej.

Informacja „jedna mapa MHD 700 KM” pochodzi od właściciela. Aplikacje nie potwierdzają jej przez odczyt zawartości ECU. Skala 700 KM w ustawieniach jest wyłącznie skalą wyświetlania, nie ogranicznikiem mocy silnika.

**Kopia ustawień NIE JEST kopią mapy MHD.** Nie ma tutaj zweryfikowanego interfejsu odczytu całej aktualnej kalibracji DME. Przycisk „Kopia mapy ECU — niedostępna” pokazuje tę przyczynę i zapisuje błąd, zamiast tworzyć pustą lub pozorną kopię. Do zabezpieczenia własnej mapy potrzebny jest jej rzeczywisty plik od tunera lub odpowiednio zweryfikowany odczyt; nie zastępuj go przywróceniem programu fabrycznego.

## Co faktycznie robi Pops Controller

Wyświetla rzeczywiste odczyty, gdy jednostka je udostępnia; ma wykresy, profile lokalne, ustawienia, diagnostykę i kopie ustawień.

**Nie reguluje strzałów, Flame, zapłonu ani mocy w mapie MHD.** W dostarczonej wcześniejszej aplikacji nie było działającego sterowania ECU, a dostępne dane nie potwierdzają bezpiecznego API dla tej jednej mapy. Sekcja „Profile / DEMO” jest zatem wyraźnie oznaczonym podglądem sterowania. Zapisuje tylko lokalne wartości w aplikacji. Próba sterowania ECU pokazuje `MHD_CONTROL_UNAVAILABLE` wraz z pełnym opisem i informacją, że nic nie wysłano do DME. Połączenie telemetryczne LIVE nie oznacza połączenia do zapisu ustawień MHD.

Nie ma pozornego przełączania wielu map. Kamera OEM, generowanie dźwięku silnika w głośnikach i zastąpienie fabrycznego zestawu wskaźników nie są zaimplementowane w tym wydaniu. Raport możliwości oznacza je jako `UNAVAILABLE`.

## Instalacja — aktualizacja tego samego repozytorium

Użytkownik ma istniejące źródło `evgkeystore-xxx/m3-dual-gauges`, gałąź `main`. Ta paczka zawiera manifest **wszystkich trzech aplikacji**; nie trzeba osobnego repozytorium dla każdej.

1. Zachowaj kopię dotychczasowych plików repozytorium. Rozpakuj główny ZIP do nowego folderu na komputerze.
2. Zastąp pliki starego wydania kompletem z nowej paczki. Usuń z drzewa repozytorium stare TGZ, stare katalogi wersji i duplikaty dużych bitmap — samo dogranie nowych plików zostawi je w pobieranym archiwum. Nie usuwaj repozytorium ani lokalnego katalogu `.git`. W istniejącym repozytorium podmień `mgu-repo.json`, trzy katalogi w `apps` oraz pliki `tools` z tego wydania. Nie usuwaj MGU Store ani innych aplikacji w samochodzie.
3. Prześlij rozpakowane pliki do głównego katalogu repozytorium — nie sam ZIP i nie nadrzędny folder z nazwą archiwum. Katalogi `apps` i `tools` muszą zachować swoje nazwy i położenie.
4. Zatwierdź całą zmianę jednym commitem. Nie usuwaj manifestu w osobnym commicie: wcześniejsze chwilowe błędy `no mgu-repo.json` występowały właśnie w wersjach repozytorium bez tego pliku.
5. W MGU Store odśwież to samo źródło. Oczekiwane wersje to **0.4.0, 1.4.0 i 1.1.0**. Nie instaluj poprzednich numerów.
6. Zainstaluj usługę **M3 Diagnostics 1.0.0** i aktualizacje trzech aplikacji. Usługa jest wpisana jako zależność, którą Store powinien instalować przed aplikacjami. Jeśli nie zrobi tego automatycznie, wybierz ją w kategorii narzędzi. Renderer MGU musi pozostać zainstalowany — korzystamy z tego samego mechanizmu renderowania co działające zegary.
7. Otwórz aplikacje pojedynczo, na postoju. Sprawdź status w lewym dolnym rogu. Sam napis „Installed” w Store oznacza instalację, nie poprawne otwarcie ekranu.

Podmieniaj, nie dogrywaj obok starego katalogu o innej nazwie. W `apps/<id>/app.json` pozostaje jeden aktualny numer wersji. Nowe katalogi instalacyjne zawierają pełne TGZ ze źródłami; starsze pliki TGZ nie są potrzebne temu wydaniu.

## Dlaczego kod jest w TGZ, a nie w setkach plików obok

Układ jest zgodny z dostarczonym repozytorium przykładowym: `apps/<id>/app.json`, ikona i `<id>@<version>.tgz`; `tools/prebuilt.js` wskazuje istniejący pakiet. TGZ nie jest skrótem ani samym manifestem. Zawiera `mgu-app.json`, oba moduły startowe `src/main.js` i `src/online-host.js`, pełne `lib`, renderer, RHMI, zasoby i licencje.

MGU Store buduje pakiet źródłowy na jednostce, korzystając z jej SDK i zgodnego pliku uruchomieniowego. Nie dołączono kopii BMW SDK. Taki układ nie powiela kilkudziesięciu megabajtów zasobów i ogranicza liczbę plików przesyłanych przez przeglądarkę. Dokładne rozmiary skompresowane i rozpakowane podaje `RAPORT_TESTOW.md`.

Do obejrzenia wszystkich źródeł użyj osobnego ZIP-a `BMW_M3_TRZY_APLIKACJE_PELNE_ZRODLA.zip` albo uruchom lokalnie `python tools/unpack-sources.py`. Powstanie katalog `sources`; nie trzeba przesyłać go do GitHuba. Samo dodanie zewnętrznego katalogu `tools` nie rozwiązuje błędów uruchomienia — tutaj jest on częścią kompletnej, spójnej struktury.

## Alternatywa USB

Osobny ZIP USB ma katalog `mgu-repo/m3-suite`. Skopiuj ten katalog wraz z zawartością na pendrive. Zawiera katalog aplikacji, trzy pełne pakiety, usługę diagnostyczną oraz poprawne sumy kontrolne.

**Nie mieszaj jednocześnie aktualizacji z różnych źródeł tych samych identyfikatorów.** Do już zainstalowanych aplikacji z GitHuba użyj aktualizacji tego samego repozytorium. Store może traktować identyczny identyfikator z innego źródła jako konflikt lub odrębną aplikację. Wariant USB jest alternatywą wdrożenia, nie wymaganym drugim etapem aktualizacji GitHub.

## LIVE, częściowe dane i DEMO

Start nie czeka na połączenie z samochodem: najpierw powstaje ekran, a transport odczytów działa niezależnie. Niedostępny interfejs danych nie powinien blokować otwarcia UI.

* `LACZENIE`: oczekiwanie na pierwsze poprawne dane; brakujące pola to `--`.
* `LIVE`: świeże RPM i prędkość pochodzą z odczytów pojazdu. Pozostałe parametry mogą być nadal niedostępne i wtedy pozostają `--`.
* `CZESCIOWO LIVE`: dostępne tylko RPM albo prędkość. Nie zastępujemy pozostałych pól symulacją.
* `DEMO`: przez 12 sekund nie było żadnego z dwóch podstawowych świeżych odczytów. Włącza się tylko przy aktywnym ustawieniu automatycznego DEMO. Górny pasek i dolny status wyraźnie oznaczają symulację.
* `BRAK DANYCH`: brak odczytów przy wyłączonym automatycznym DEMO.

Po powrocie prawidłowych danych aplikacja przechodzi z DEMO do odczytów. Odczyt `0 RPM` przy wyłączonym silniku jest prawidłowym zerem, a nie dowodem awarii połączenia. Nie jest zamieniany na DEMO, gdy pochodzi z aktualnej, poprawnej odpowiedzi. Dane odczytane jako `null`, brak właściwości, tekst lub wartość nieważna nie są zamieniane na zero.

Wykres nie zaczyna się od fikcyjnego przebiegu. Po naciśnięciu START zapisuje próbki; zmiana trybu LIVE/DEMO czyści dotychczasowe próbki, aby ich nie mieszać. Okno pomiaru ma 60 sekund; dotknięcie wykresu wybiera próbkę. Kwantyfikowane odczyty mocy są obliczeniem z RPM i momentu, nie pomiarem z hamowni.

## Jakie dane są odczytywane

RPM, prędkość, temperatury oleju i płynu oraz sygnał momentu wykorzystują te same rodziny interfejsów i przeliczenia co dostarczona aplikacja Car Data. Dodatkowe dane są odczytywane przez obsługiwane PID-y OBD 01: kąt zapłonu, napięcie, temperatura dolotu i ciśnienia. Najpierw sprawdzana jest mapa obsługiwanych PID-ów. Nie każdy samochód/program DME udostępnia wszystkie pola.

Doładowanie jest wyznaczane tylko po uzyskaniu ciśnienia bezwzględnego i ciśnienia atmosferycznego. Nie odejmujemy wymyślonej stałej atmosfery. Odczyt ciśnienia w kolektorze nie jest pomiarem celu doładowania ani dowodem poprawności mapy. Ustawienia i wskaźniki tych aplikacji nie zastępują fabrycznych ostrzeżeń ani zegarów.

## Pełne błędy na ekranie i w telefonie

Dolny lewy status pokazuje tryb, źródła RPM i prędkości oraz liczbę aktywnych błędów. Dotknięcie otwiera stronę **Błędy**: kody, pełne komunikaty, stosy wywołań, liczniki powtórzeń, informacje o odzyskanym połączeniu oraz kolejne strony tekstu.

Każda aplikacja zapisuje własne pliki od najwcześniejszego punktu startu, przed inicjalizacją SDK:

```
/var/opt/public/oap/oap_<UID>/data/m3-boot.log
/var/opt/public/oap/oap_<UID>/data/m3-events.ndjson
/var/opt/public/oap/oap_<UID>/data/m3-status.json
```

Nowy panel diagnostyczny działa niezależnie od ekranów tych aplikacji:

```
http://172.16.222.97:8484
```

To **port 8484**, a nie dotychczasowe **8470** panelu MGU Store. Adres IP jest adresem podanym przez użytkownika. Usługa nasłuchuje na tym adresie oraz lokalnie `127.0.0.1`; przy innym adresie jednostki konfiguracja usługi wymaga dostosowania. Telefon musi mieć lokalny dostęp do tej samej jednostki.

W panelu wybierz aplikację, kliknij jej ikonę w BMW, a następnie wybierz **Logi uruchomienia**. Do pobrania są pełny raport JSON i dziennik filtrujący rzeczywisty UID aplikacji. Raport pokazuje również obecność pakietu, aktywnych procesów, etap startu i wiek ostatniego statusu. Brak wpisów jest oznaczony jako brak danych, nigdy jako udane uruchomienie. Nie ma gwarancji, że dziennik systemowy zawiera każde zdarzenie z zamkniętych komponentów BMW; dlatego dodano również własne pliki startowe.

Panel jest tylko do odczytu, bez uruchamiania dowolnych poleceń, wgrywania plików i operacji ECU. Ogranicza dostęp do lokalnego adresu/hotspotu. Nie przekierowuj portu do internetu. Raporty mogą zawierać szczegóły pojazdu: przejrzyj je przed publicznym udostępnieniem.

Jeśli panel się nie otwiera, sprawdź najpierw instalację `M3 Diagnostics`, jej usługę i połączenie lokalne — brak tego panelu nie oznacza awarii ECU. Dostępny jest również odczytowy skrypt `tools/collect-startup.sh` dla istniejącego dostępu SSH. Nie wymaga flashowania ani ponownego odblokowywania jednostki.

## Kopia — co i kiedy zapisuje

Przycisk **Kopia → Wykonaj kopię ustawień** tworzy rzeczywisty plik JSON. Kopia powstaje także przy starcie nowego kodu i przed zapisaniem zmienionych ustawień. Jeśli automatyczna kopia przed zmianą ustawień się nie uda, zapis nowych ustawień zostaje przerwany i jest rejestrowany błąd.

Kopia zawiera ustawienia tej aplikacji, lokalne profile i — przy kopii ręcznej — raport diagnostyczny. Zachowuje również zawartość wcześniejszych własnych plików `profiles-v4.json` i `config.json`, jeśli są dostępne w katalogu danych. Nie przenosi tych ustawień do ECU. Nowy interfejs używa własnego pliku `m3-settings.json`; stare pliki nie są kasowane.

Kopie znajdują się w `data/m3-backups/settings-*.json`. Zachowywanych jest ostatnich 20; można je pobrać z nowego panelu. Każda ma `kind: APP_SETTINGS_ONLY_NOT_ECU` i `ecuMapIncluded: false`. To nie jest eksport mapy MHD, odczyt pamięci ECU ani zamiennik pliku tunera.

## Wygląd i ikony

Zestaw ma własne ikony: dwa sportowe łuki, płomień i panel zegarów. Zastąpiono nazwę/ikonę Car Data w zasobach aplikacji, bez usuwania informacji o autorach z licencji. Cockpit ma 12 wybieranych układów/palet rysowanych wektorowo zamiast dużych gotowych bitmap.

Układ wykorzystuje wymiary projektowe renderera **2880 × 960**. Faktyczny obszar aplikacji w dostarczonym rendererze iDrive 8 to **Y = 76…840**. Nowe elementy są wewnątrz tego obszaru; górny pasek i klimatyzacja pozostają poza nim. Nie należy utożsamiać każdej jednostki projektowej z fizycznym pikselem każdej wersji LCD.

Nie dołączono plików czcionek BMW ani systemowych. Kod może korzystać z atlasów już zainstalowanych na jednostce; przy ich niedostępności używa własnego awaryjnego rysowania liter. Zrzuty w raporcie pochodzą z lokalnego renderowania, nie z Twojego samochodu.

## Co sprawdzono, a czego nie

`RAPORT_TESTOW.md` i pliki JSON opisują rzeczywiście wykonane testy: start przez referencyjny host przy zamockowanym SDK/socketach, przejścia stanów danych, przeliczenia, uprawnienia logiczne interfejsu odczytowego, kopie, panel HTTP, rysowanie ekranów i integralność pakietów.

**Nie wykonano testu na Twojej jednostce MGU ani pomiaru rzeczywistych danych BMW.** Powodzenie lokalnego testu hosta nie jest gwarancją zgodności konkretnego firmware, jego uprawnień SOME/IP lub SDK. W tej paczce diagnostyka ma wskazać rzeczywisty etap zatrzymania, gdyby środowisko pojazdu odrzuciło uruchomienie.

Nie należy uznawać tego wydania za ukończony sterownik MHD. Funkcje niepodłączone do zweryfikowanego interfejsu zostały zablokowane i nazwane, a nie ukryte za przyciskiem pozornego sukcesu. Pierwszy test wykonaj na postoju; nie instaluj ani nie konfiguruj aplikacji podczas jazdy.

## Źródła i licencje

Dokładne źródła lokalne: `car-apps-main (1)(1).zip`, `M3_DUAL_GAUGES_0_3_4_POPRAWNE_WYMIARY_GITHUB.zip`, `BMW_M3_DWIE_APLIKACJE_LICENCJE_POPRAWIONE.zip` oraz pierwotny pakiet dwóch aplikacji. Licencje i NOTICE referencyjnego renderera zachowano w aplikacjach. `THIRD_PARTY_NOTICES.md` dokumentuje nowe zmiany i pochodzenie kodu.

Publiczna dokumentacja formatu źródeł i zależności: https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md

Publiczny opis funkcji MHD S58: https://mhdtuning.com/products/mhd-super-license-for-s58

Zachowanie plików licencyjnych nie nadaje dodatkowych praw do modyfikacji lub redystrybucji komponentów zewnętrznych. Przed publicznym udostępnieniem całego zmodyfikowanego repozytorium sprawdź warunki w `UPSTREAM-ITERIODEV-LICENSE.md`; nie zakładaj, że nazwa własnej aplikacji zmienia licencję podzespołów.
