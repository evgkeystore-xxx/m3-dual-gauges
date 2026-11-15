# BMW M3 — komplet trzech aplikacji i niezależna diagnostyka

**Wersje:** M3 Dual Gauges 0.5.0, Pops Controller 1.5.0, M3 Cockpit Studio 1.2.0.
**System docelowy:** istniejący MGU Store i renderer na BMW M3 G80 / iDrive 8.
**Stan weryfikacji:** testy lokalne kodu, ramek komunikacji i pakowania. Nie wykonano testu tej wersji na rzeczywistym BMW ani z jego oryginalnym SDK. Instalacja nie jest dowodem otwierania ekranu.

## Aktualizacja wyglądu i dotyku — 15.11.2026

Wersje 0.5.0 / 1.5.0 / 1.2.0 to pełne aplikacje w nowym stylu Motorsport:
ciemnogranatowe panele, niebiesko-czerwone podświetlenia, pozioma nawigacja,
duże przyciski, suwaki dotykowe i telemetria z prawej. Styl jest autorską
interpretacją przesłanego przykładu. Wszystkie ekrany zachowują miejsce dla
oryginalnej belki klimatyzacji.

**Ważna poprawka dotyku:** ekran renderowany przez GPU nie musi posiadać
fokusu standardowego widgetu RHMI. Poprzedni kod potrafił w takim przypadku
wyłączyć przechwytywanie dotyku, mimo że ekran nadal był widoczny. Obecna
wersja zwalnia obszar dotyku dopiero wtedy, gdy ekran naprawdę znika.
Przyciski reagują na DOWN albo na pojedynczy UP, a suwaki na DOWN/MOVE/UP.
Dodałem test wysyłający rzeczywisty komunikat TOUCH przez symulowany socket
renderera, a nie tylko bezpośrednie wywołanie metody przycisku.
W pierwszej kolejności aplikacje łączą się z `mgu-render` na
`/run/mgu-render/render.sock`, aby nie trafić przypadkowo na drugi renderer
przez `/run/mgu-renderd/renderd.sock`. Jeśli nowszy socket nie odpowie,
po 3 sekundach próbują zgodnego starego socketu.

**Jak sprawdzić, dlaczego dotyk nie działa:** po uruchomieniu na dole
po lewej odczytaj `DOTYK GOTOWY : N` albo `DOTYK NIEAKTYWNY : 0`.
N to licznik odebranych zdarzeń. Dotknij dowolnej zakładki i sprawdź, czy
liczba rośnie. Jeśli nie rośnie, otwórz `http://172.16.222.97:8471`
(aktualny adres IP MGU może być inny) i pobierz raport aplikacji.
Sprawdź pola `rendererSocket`, `rendererProtocol`, `touchAdvertised`,
`touchEvents` oraz `lastTouch`. To odróżnia problem renderera od błędu
wykrywania przycisku. Sprawdź, czy masz aktualną wersję komponentu `mgu-render` w MGU Store
(np. 0.6.21 widoczną na Twojej liście), a po jej aktualizacji uruchom ponownie
**samą jednostkę multimedialną**, nie flashuj silnika. Jeżeli READY nie ogłasza
obsługi dotyku, sama aktualizacja aplikacji nie może jej zapewnić.
Przeczytaj dziennik `journalctl -u mgu-render` i diagnostykę `8471`.

**Testy w BMW pozostają konieczne.** Lokalny symulator sprawdza działanie
przycisków, suwaków i obsługę zdarzeń, ale nie potwierdza rzeczywistego
przekazywania dotyku na Twoim ekranie.

## Najważniejsze: mapa MHD 700 KM

W pakiecie nie ma mapy, jej zastępnika, flashowania ECU ani przełączania slotów.
Około 700 KM to informacja podana przez właściciela — nie wynik pomiaru aplikacji.
Aplikacje nie odczytują i nie tworzą pełnej kopii mapy silnika.

- **KOPIA USTAWIEŃ** zapisuje prawdziwy plik JSON ustawień aplikacji. Nie jest kopią ECU.
- **PRZYWRÓĆ USTAWIENIA** przywraca ustawienia aplikacji, nie fabryczne oprogramowanie silnika.
- **ORYGINALNE** na stronie wydechu oddaje sterowanie klapą aktualnej mapie MHD / sterownikowi. Nie wgrywa fabrycznej mapy.
- Automatyczne odczyty są tylko odczytami. Sterowanie klapą wymaga dwóch naciśnięć tego samego przycisku i świeżej rzeczywistej prędkości na postoju.
- Automatyczne DEMO nie zezwala na sterowanie samochodem.

**Istotne ograniczenie:** w przesłanym przykładzie Live Adjustments regulacja slotów burble dotyczy MG Flasher, nie MHD. Dla Twojego MHD wykorzystany jest osobny mechanizm klapy. Otwarcie klapy NIE generuje strzałów ani nie zmienia długości/agresywności popsów. Te suwaki są jawnie oznaczone jako lokalne DEMO. Kod nie próbuje zastąpić brakującego API zapisem obcej mapy.

## 1. Instalacja przez dotychczasowe repozytorium

1. Zrób lokalną kopię aktualnego katalogu repozytorium na komputerze.
2. W jego bieżącej zawartości zastąp poprzedni zestaw plików zawartością tego folderu. Nie dodawaj nowej paczki jako kolejnego ZIP-a do starych paczek.
3. Na głównym poziomie muszą leżeć `mgu-repo.json`, `catalog.json`, `apps` i `tools`. Folder `SOURCE` zawiera kompletny wspólny kod, a aplikacje w `apps` zawierają gotowe TGZ ze wszystkimi swoimi modułami i zasobami.
4. Usuń z **bieżącego drzewa** repozytorium poprzednie wielkie ZIP-y, dawne rozpakowane kopie aplikacji i duplikaty USB. Ich pozostawienie może nadal przekroczyć limit całego pobieranego repozytorium. Nie trzeba usuwać historii Git. Nie usuwaj innych własnych projektów.
5. Zatwierdź wszystkie zmiany razem na `main`, zamiast osobno kasować i przywracać `mgu-repo.json` w kolejnych commitach. Zapobiega to chwilowemu `no mgu-repo.json`.
6. W MGU Store odśwież istniejące źródło `evgkeystore-xxx/m3-dual-gauges`, gałąź `main`.
7. Zainstaluj **M3 Suite Diagnostics 1.0.0** w narzędziach. Jest zależnością aplikacji, więc Store powinien zainstalować go także automatycznie. To usługa diagnostyczna, nie czwarta aplikacja zegarów.
8. Zaktualizuj trzy aplikacje do wersji podanych na początku. Nie odinstalowuj Car Data, Store ani działającego renderera.
9. Pierwszą próbę wykonaj na postoju. Uruchom najpierw Dual Gauges, następnie osobno Cockpit i Pops. Uruchom ponownie MGU przez dostępny przycisk Store, jeżeli Store oznaczy aktualizację jako wymagającą restartu. Nie flashuj ECU.

Używaj dotychczasowego źródła, nie dodawaj go drugi raz. Jeżeli Store proponuje osobne identyfikatory zakończone `2` lub konflikt źródeł, zatrzymaj instalację duplikatu: zestaw jest aktualizacją oryginalnych identyfikatorów `m3_dual_gauges`, `ks_pops_controller`, `ks_m3_cockpit`.

## 2. Instalacja z USB

Skopiuj zawartość tego folderu do:

```text
pendrive/
  mgu-repo/
    m3-suite/
      mgu-repo.json
      catalog.json
      apps/
      tools/
      packages/
      SOURCE/
      ...
```

W Store otwórz USB i wybierz katalog/katalog aplikacji z tego nośnika. `catalog.json` zawiera rzeczywiste rozmiary i SHA256 trzech źródłowych instalatorów i narzędzia diagnostycznego. Na samochodzie pozostaje wymagany istniejący renderer oraz możliwość połączenia modułów z SDK obecnym w jednostce. Pakiet nie zawiera SDK BMW.

Nie kopiuj samego zewnętrznego ZIP-a jako aplikacji. Nie wybieraj równocześnie dwóch źródeł tej samej aplikacji do osobnych instalacji.

## 3. Dane rzeczywiste i DEMO

Po otwarciu aplikacja próbuje odczytać SOME/IP i wybrane diagnostyczne PID-y OBD z jednostki. Nie trzeba ręcznie wprowadzać RPM ani prędkości.

- **LIVE:** aktualne odczyty RPM i prędkości. Nie oznacza dostępności każdego dodatkowego czujnika.
- **LIVE / NIEPEŁNE:** dostępny jest jeden z podstawowych odczytów. Inne brakujące liczby pozostają `--`; nie są uzupełniane wymyślonymi wartościami.
- **CONNECTING:** trwa próba połączenia / oczekiwanie na świeże dane.
- **DEMO:** brak obu podstawowych odczytów po okresie oczekiwania. Wszystkie pokazywane wartości tego ekranu są symulacją. Status jest widoczny u góry i na dole.
- **OFFLINE:** brak danych i wyłączone automatyczne DEMO.

Po uzyskaniu rzeczywistego sygnału aplikacja wraca z DEMO do odczytów. Wykres jest czyszczony przy zmianie trybu, żeby nie mieszać historii demonstracyjnej z jazdą. Zero RPM przy wyłączonym silniku jest prawidłowym odczytem, jeżeli sygnał jest świeży.

Moc KM/kW jest **obliczana** z odczytanego RPM i momentu, a nie mierzona na hamowni. Skala 700 KM nie jest ogranicznikiem mocy. Ciśnienie doładowania wymaga prawidłowych PID-ów MAP i ciśnienia atmosferycznego. Przy nasyceniu PID-u MAP aplikacja nie udaje dokładnego pomiaru.

## 4. Gdzie są pełne błędy — także gdy ikona nie otwiera ekranu

### W aplikacji

Lewy dolny przycisk pokazuje stan połączenia i liczbę aktywnych komunikatów. Naciśnięcie otwiera pełny raport z przewijaniem stron. Przycisk **BŁĘDY** w menu prowadzi do tego samego raportu. Przy braku danych krótki błąd pojawia się również w dolnym pasku komunikatów.

Raport zawiera etap startu, renderer, interfejsy, świeżość odczytów, pochodzenie wartości, stosy błędów oraz zaakceptowane albo odrzucone polecenia klapy. Hasła/tokeny w tekstach są maskowane.

### Na telefonie, niezależnie od ekranu aplikacji

Dla podanego wcześniej adresu MGU:

```text
http://172.16.222.97:8471
```

Port **8471**, nie 8470. Telefon musi mieć połączenie z tą samą siecią / dostępem do samochodu, przez który otwierasz MGU Store. Gdy IP samochodu się zmieni, użyj nowego IP z portem 8471. Aktualnie wykryty adres znajduje się również w ustawieniach aplikacji.

Panel pokazuje trzy aplikacje, wersje, etap startu, znacznik aktywności procesu, stan renderera i komplet błędów. Przy każdej aplikacji:

- **Pobierz pełny raport** — stan i log aplikacji w JSON, także błąd inicjalizacji SDK.
- **Dziennik procesu UID** — systemowy dziennik właściwego UID, nie dziennik aktualizatora.
- **Ostatnia kopia ustawień** — ostatni zapisany plik ustawień, nie ECU.

Jeżeli proces nie uruchomił się wystarczająco daleko, panel mówi **NO_RUNTIME_REPORT / BRAK RAPORTU**. Nie pokazuje wtedy fałszywego „działa”. Stary raport jest oznaczony **STALE_REPORT**. Brak wpisów w dzienniku systemowym nie jest dowodem poprawnego działania.

Gdy strona 8471 nie odpowiada, sprawdź w MGU Store instalację narzędzia **M3 Suite Diagnostics**, jego status oraz IP. Samo zainstalowanie jednej aplikacji z pominięciem zależności nie uruchomi serwera diagnostycznego.

Panel jest lokalny i tylko do odczytu. Nie udostępnia endpointu wysyłania poleceń do ECU, zapisu plików ani dowolnych komend terminala. Nie wystawiaj go przez przekierowanie portów do internetu. Pełne raporty mogą zawierać lokalne adresy i ścieżki: nie publikuj ich bez przeglądu.

## 5. Zakres trzech aplikacji

**M3 Dual Gauges:** dwa różne zegary RPM/prędkości, dodatkowe parametry, wykres RPM z 60 sekund, motywy, sygnalizacja wysokich obrotów, kopia ustawień i diagnostyka.

**M3 Cockpit Studio:** 12 wybieranych motywów w czterech układach / różnych paletach, telemetria i wykres. Jest aplikacją ekranu centralnego, nie zamiennikiem fabrycznych zegarów za kierownicą.

**Pops Controller:** rzeczywista ścieżka odczytu danych, parametry/wykres/silnik, potwierdzane polecenia MHD otwarcia/zamknięcia/oddania klapy i niezależny odczyt jej pozycji. Sterowanie wymaga obsługi odpowiednich poleceń przez mapę/DME; odpowiedź negatywna albo timeout jest pokazany jako błąd. Samo ACK nie jest utożsamiane z fizycznym ruchem klapy.

**Niezaimplementowane i jawnie oznaczone:** regulacja długości/agresywności popsów MHD, kopia lub flash mapy ECU, przełączanie map, integracja tylnej kamery, synteza dźwięku przez fabryczny system audio i podmiana ekranu za kierownicą. Lokalne profile Comfort/Sport/Sport+/P/N nie przełączają fizycznego trybu jazdy ani parametrów silnika. Nie ma ukrytego kodu, który te funkcje pozoruje jako wykonane.

## 6. Wymiary i uruchamianie

Rysowanie używa zgodnego protokołu `renderer/kit/renderd.js` z działających zegarów, bez blokady wymagającej wyłącznie `mgu-render/1`.

Układ referencyjny ID8: 2880 × 960 jednostek projektowych; natywny górny pasek 0–76, obszar aplikacji 76–840, klimatyzacja 840–960. Renderer skaluje całość do rzeczywistego panelu. Nie są to gwarantowane fizyczne piksele LCD. Poza obszarem aplikacji obraz jest przezroczysty, dotyk nie jest przejmowany.

Źródłowy pakiet OAP ma `mgu-app.json`, komplet `src/main.js` i `src/host.js`, oraz staged `package/` z runtime, zasobami, manifestami i RHMI. Listy modułów oraz wersje są sprawdzane także wewnątrz gotowych TGZ. `appletId` przydziela instalator, nie jest narzucony na sztywno.

Nazwy i ikony są własne, spójne w Store i RHMI. Źródłowe SVG i PNG są w `SOURCE/icons`. Nie ma obrazków ani filmów pobieranych z internetu w czasie pracy.

## 7. Sprawdzenie i przebudowanie

Na komputerze z Pythonem 3 i Node.js:

```text
python SOURCE/build.py
node TESTS/test.js
python TESTS/validate_packages.py
```

Do samego użycia przygotowanych TGZ nie trzeba uruchamiać tych poleceń na komputerze. MGU Store łączy moduły z SDK obecnym w samochodzie.

`TESTS/results.json` zawiera wynik testów fixture/protokołu; `TESTS/package-results.json` kontrolę instalatorów; `DOCS/PACKAGE_SIZES.json` rozmiary. Podglądy `DOCS/PREVIEW` są wykonane lokalnie na jawnie demonstracyjnych wartościach, nie są zdjęciami działającego BMW.

Testy nie obejmują fizycznego MGU, faktycznej wersji mapy MHD ani ruchu klap. Pierwsze potwierdzenie rzeczywistego działania musi pochodzić z samochodu. Rozbudowana diagnostyka służy temu, aby kolejna niezgodność nie kończyła się samym „zainstalowano” i pustą ikoną.
