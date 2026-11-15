# BMW M3 G80 / M Control — trzy aplikacje

## Wersje w paczce

- `m3_dual_gauges` 0.5.0
- `ks_pops_controller` 1.5.0
- `ks_m3_cockpit` 1.2.0
- `m3-suite-diagnostics` 1.0.0 (usługa diagnostyczna, nie czwarta ikona)

**Wygląd** jest autorską implementacją na podstawie przesłanego przez właściciela wzoru M Control: panele grafitowo-granatowe, neonowe czerwono-niebieskie obramowania, tryby Comfort/Sport/Sport+/P/N, suwaki i telemetria po prawej. Wbudowane podglądy PNG przedstawiają lokalne wartości DEMO, a nie prawdziwe odczyty auta.

## Instalacja w istniejącym MGU Store

1. Zachowaj kopię aktualnego repozytorium `evgkeystore-xxx/m3-dual-gauges`.
2. Rozpakuj **DO_GITHUB.zip**. Wgraj jego **rozpakowaną zawartość**, nie sam ZIP, na gałąź `main`.
3. Podmień całe `apps/`, `tools/`, `packages/` oraz pliki `mgu-repo.json`, `catalog.json`. Usuń z bieżącej wersji repozytorium nieużywane stare TGZ/ZIP i stare foldery wersji; nie ruszaj historii Git ani pozostałych projektów.
4. W MGU Store odśwież istniejące źródło i sprawdź numery wersji podane wyżej.
5. Zainstaluj aktualizacje trzech aplikacji i usługę M3 Suite Diagnostics (może się zainstalować jako zależność). Po zmianie wersji renderera uruchom ponownie **head unit MGU**, nie sterownik silnika.
6. Pierwsze próby dotyku i komunikacji wykonuj **na postoju**.

## Gdy kliknięcie przycisków nie działa

Pod spodem odczytaj `DOTYK GOTOWY/NIEAKTYWNY : licznik` i kliknij zakładkę. Jeśli licznik nadal pokazuje zero, sprawdź panel:

```text
http://172.16.222.97:8471
```

To adres przykładowy z Twojego samochodu; gdy IP się zmieni, wstaw aktualny. Raport zawiera `touchAdvertised`, `touchEvents`, `rendererSocket`, `rendererProtocol`, `lastTouch`, `rhmiFocus` i `touchClaim`.

- `touchAdvertised: false` oznacza brak potwierdzonego przekazywania dotyku przez renderer. Sprawdź w Store komponent Renderer, jego faktycznie aktywną wersję i restart MGU. Ponowna instalacja aplikacji nie włączy funkcji brakującej w rendererze.
- `touchAdvertised: true`, ale `touchEvents: 0` po rzeczywistym dotknięciu oznacza problem z trasą wejścia/claim/foreground renderera. Odczytaj dziennik `mgu-render` i raport.
- `touchEvents > 0`, ale brak działania konkretnego przycisku: w raporcie sprawdź `TOUCH_UNMAPPED` i surowe współrzędne. To już błąd aplikacji, możliwy do naprawienia na podstawie tych danych.

## Jedna mapa MHD ok. 700 KM

Paczka nie zawiera poleceń flashowania ECU, przełączania map ani przywracania fabrycznego ECU. „KOPIA” dotyczy tylko ustawień aplikacji, **nie mapy silnika**. „ORYGINALNE” w zakładce KLAPA MHD oddaje sterowanie klapą aktualnej mapie i nie przywraca oprogramowania fabrycznego. Potwierdzane polecenia klapy wymagają realnego odczytu prędkości na postoju; brak odpowiedzi DME jest błędem. Suwaki długości, opóźnienia i mocy pops to **lokalne DEMO** — brak zweryfikowanego API MHD do ich zapisu w Twojej pojedynczej mapie.

## Testy i ograniczenia

Lokalnie zaliczono 31 testów, w tym pełny komunikat TOUCH przez symulowany socket renderera. Przeprowadzono kontrolę manifestów i rzeczywistych plików TGZ. **Nie testowano nowego wydania na fizycznym MGU**, więc nie można zapewnić, że Twoja jednostka przekaże dotyk ani że wszystkie parametry auta są dostępne. Podglądy nie są zrzutami z samochodu.
