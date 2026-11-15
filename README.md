# M3 Dual Gauges 0.3.4 — poprawa obszaru ekranu iDrive 8

Wersja 0.3.4 zachowuje działający kod startowy wersji 0.3.3. Zmieniony został tylko układ komponentów GPU i numer wersji w manifestach.

Wymiary referencyjne wyciągnięte z dołączonego przez użytkownika Car Data 1.4.1, Drag Timer 1.2.0 i eDrive 1.1.0:
- projekt renderera: 2880 × 960 jednostek (nie fizycznych pikseli LCD)
- systemowy obszar u góry / zakładki: Y=76–248
- główna treść: Y=248–816
- dolny obszar systemowy i pasek klimatyzacji: poniżej Y=816

Komponenty M3 Dual Gauges 0.3.4:
- tytuł: x=80, y=255, w=2720, h=48
- RPM: x=270, y=315, w=1000, h=418
- prędkość: x=1610, y=315, w=1000, h=418
- podpisy: y=759, h=40

Wszystkie komponenty mieszczą się w strefie 248–816. Wyrenderowany układ wymaga sprawdzenia na jednostce MGU; ta paczka nie potwierdza odczytów na żywo.

Instalacja: rozpakuj ZIP i podmień pliki w gałęzi main istniejącego repozytorium evgkeystore-xxx/m3-dual-gauges, zachowując apps/ oraz tools/. Odśwież MGU Store i sprawdź wersję 0.3.4.
