# Zmiany i podstawy sprawdzenia

Materiały faktycznie otwarte:
- `car-apps-main (1)(1).zip`: Car Data 1.4.1, Drag Timer, eDrive, Service,
  Ambient/Seats oraz Live Adjustments 1.2.0; lifecycle, RHMI, dane i TASU.
- `M3_DUAL_GAUGES_0_3_4_POPRAWNE_WYMIARY_GITHUB.zip`: działająca podstawa renderera.
- `BMW_M3_DWIE_APLIKACJE_LICENCJE_POPRAWIONE.zip`: poprzednie Pops 1.3.7 i Cockpit 1.0.7.
- `BMW_M3_G80_DWIE_APLIKACJE_NATIVE_START_USB (1).zip`: wcześniejsza podstawa aplikacji.

W starej parze klient renderera odmawiał rysowania bez zgłoszenia natywnego
`mgu-render/1` i odpowiedniego `appArea`; działające zegary używały
kompatybilnego HELLO/READY oraz kit/renderd. Nowy zestaw korzysta ze wspólnego
protokołu kit/renderd, testowanego z lokalnym symulatorem socketu.

Stara para miała ręczne/symulowane wartości zamiast pełnego przyłączenia
odczytów. Nowy zestaw ma getter polling SOME/IP oraz ograniczone PID-y OBD.

Nazwy API i przeliczniki pochodzą z przykładów, ale nowy kontroler danych,
polityka komend, host, GUI, logowanie i panel WWW są nowym kodem.
Nie skopiowano całych objętych odrębną licencją aplikacji ze zmienioną nazwą.

Odczyty podstawowe:
- CDS.statusEngineSpeed2.actualValueRPMEngineCrankshaft × 0.25.
- Vehicle2.statusCarSpeed2.speedVehicleCentreOfGravity ÷ 64.
- CDS.statusEngineTemperature temperatury − 48.
- FES.statusActualValueTorque2.actualValueTorqueCrankshaft × 0.5 − 1023.5.
- OBD Mode 01: 05, 0B, 0C, 0D, 0E, 0F, 33, 5C.
- Moc liczona z RPM i momentu, nie pomiar hamowni.
- Jednostka LevelMonitor.systemVoltage jest wnioskowana z wielkości surowej
  wartości; raport zaznacza tę niepewność.

Dopuszczona akcja poza odczytami: MHD exhaust flap 2F 02 00/01/02,
po potwierdzeniu, na postoju ze świeżym sygnałem rzeczywistej prędkości.
Nie dodano MHD map switch 2F 01, Max Cooling 2F 03 ani MG Flasher 2E 69 xx.
Oddanie wcześniej przejętej klapy jest dozwolone także w procedurze kończenia
procesu. Nie wykonuje flashowania ani przełączenia mapy.

Granice wsparcia:
Przykładowy Live Adjustments w swoim README oznacza mechanizm klapy MHD
jako nieprzetestowany w samochodzie dla tej wersji. Zatem ani ten przykład,
ani nasze testy fixture nie stanowią potwierdzenia obsługi przez konkretną
mapę użytkownika. Ujemna odpowiedź DME lub brak odpowiedzi ma być pokazany,
nie zamieniony na „wykonano”.

Dokumentacja zewnętrzna sprawdzona podczas przygotowania:
- https://raw.githubusercontent.com/robertnisipeanu/mgu-store/main/docs/PUBLISHING.md
- https://raw.githubusercontent.com/IterioDev/car-apps/main/apps/iteriodev_liveadjust/README.md

Dokumentacja zewnętrzna opisuje format/protokół, nie certyfikuje tego zestawu.
Stan testów i ograniczenia są opisane w README oraz TESTS.

## 15.11.2026 — obsługa dotyku i nowy wygląd
- Poprzedni kontroler wymagał DOWN oraz UP w tym samym przycisku; nowy obsługuje
  przyciski także przy pojedynczym DOWN, przy pojedynczym UP i suwaki DOWN/MOVE/UP.
- Wybrano preferencyjnie socket mgu-render `/run/mgu-render/render.sock`,
  jeśli istnieje. Poprzedni socket społecznościowy może należeć do innego renderera.
  Renderer jest zależnością aplikacji. Brak wsparcia dotyku jest widoczny jako
  `TOUCH_NOT_ADVERTISED`, nie jako pozornie aktywny przycisk.
- Dziennik TOUCH_RAW zawiera fazę i współrzędne, a status liczbę zdarzeń.
- Nowy projekt GPU 2880×960, szkło, gradienty, tryby Comfort/Sport/Sport+/P/N,
  kolorowe suwaki, parametry LIVE. Obszar 76..840 pozostaje oddzielony od HMI.
- Lokalna edycja profilów jest DEMO, nie steruje strzałami ani mapą ECU.
