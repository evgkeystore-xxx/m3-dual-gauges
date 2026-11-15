# BMW M3 G80 — M Control 2.3 / iDrive 8

Trzy aplikacje MGU Store: **Pops Controller 2.3.0**, **M3 Dual Gauges 0.7.3**, **M3 Cockpit Studio 1.4.3**.

## Wgranie na GitHub
1. Zachowaj kopię dotychczasowego repozytorium.
2. Rozpakuj ZIP do katalogu głównego `evgkeystore-xxx/m3-dual-gauges`. Nie wrzucaj całego ZIP-a jako jednego pliku.
3. Zachowaj katalogi `apps`, `assets/icons`, `tools`, `packages`, `mgu-repo.json` i `catalog.json`.
4. Usuń stare, nieużywane `.tgz` z poprzednich wersji z bieżącego drzewa GitHub; nie usuwaj własnych istotnych danych ani historii Git.
5. Zatwierdź zmiany na `main`. W samochodzie odśwież źródło MGU Store i sprawdź wersje 2.3.0, 0.7.3, 1.4.3.
6. Aktualizuj na postoju. Nie instaluj ponownie identycznej paczki w przypadku błędu; najpierw przeczytaj jego treść.

## Poprawki 2.2
- Nowe ikony z rzeczywistych przezroczystych plików PNG w `assets/icons/`, w tym dedykowane grafiki: silnik Sport+, doładowanie, moment obrotowy, olej, płyn chłodzący, Ustawienia. Łącznie 28 ikon.
- Każda ikona jest też osadzona wewnątrz TGZ (`package/renderer/assets/icons`) i w aktywnym module `package/renderer/runtime/icons21.js` (RGBA/zlib). **Nie ma zależności od Internetu.**
- Długość, moc i opóźnienie: czerwona część suwaka kończy się przy uchwycie; pozostały zakres ma ciemne tło.
- Pops Controller: Ustawienia można przeglądać na dwóch poziomach przez strzałkę po prawej albo gest przesunięcia po pustej części ekranu. Zawierają kopię lokalnych ustawień, ponawianie odczytów, ustawienia DEMO oraz stan ECU.
- Status LIVE/DEMO zachowano, ale przy braku świeżych wartości nie są pokazywane wymyślone odczyty jako LIVE.

## Interaktywny HTML
Osobny plik `BMW_M3_M_CONTROL_2_2_INTERAKTYWNY_PODGLAD.html` **nie znajduje się w ZIP**. Działa offline na komputerze i telefonie: trzy aplikacje, 4 tryby jazdy, suwaki, zakres RPM, Ustawienia, przewijanie w dół, logi, backup JSON. **Nie łączy się z samochodem.**

## Bezpieczeństwo
- Nie zmieniamy ani nie flashujemy pojedynczej mapy MHD ~700 KM. Brak funkcji przywracania fabrycznej mapy ECU.
- "Kopia" oznacza kopię ustawień aplikacji — NIE kopię oprogramowania/kalibracji ECU.
- Suwaki popsów to wyraźnie lokalne profile bez niezweryfikowanego zapisu MHD. Sterowanie klapą (jeśli aktywne) wymaga odpowiedzi DME i sprawdzenia postoju.
- Kamera OEM bez zweryfikowanego interfejsu zgłasza brak obsługi, nie prezentuje fikcyjnej transmisji.

## Testy
31/31 testów symulacji protokołu, bezpiecznego odczytu, dotyku i rendererów; walidacja 3 TGZ, JavaScript, JSON, ikon, SHA256 i limitu 64 MB. Ponadto lokalny test przycisków i gestów w HTML.
**To nie jest potwierdzenie na fizycznym MGU**, ani gwarancja zgodności z konkretnym firmware BMW.
