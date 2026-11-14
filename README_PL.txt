M3 DUAL GAUGES 0.1.3 — NAPRAWA OTWIERANIA KAFELKA

Najważniejsza poprawka: poprzedni kod wywoływał registerEntryPoints(), ale nie wykonywał właściwej rejestracji i odblokowania wejścia.
Teraz: entryPoint.init() -> mapEntryState() -> setText/setIcon() -> setAvailability(ENABLED) -> initialized() -> openEntryState().
Obsługuje kliknięcie przed zakończeniem inicjalizacji i wejście foreground. Zachowuje ID aplikacji oraz UUID.
W tym wydaniu RHMI nadal pokazuje proste tekstowe wartości RPM i prędkości. Ich dostępność wymaga sygnałów samochodu; aplikacja ma wyświetlić UI również przy braku sygnałów.

DO GITHUB: otwórz ZIP i prześlij zawartość z głównego poziomu (mgu-repo.json, apps/) wprost do root repozytorium, bez dodatkowego folderu.
MGU Store: odśwież main, wybierz M3 Dual Gauges 0.1.3 i zaktualizuj. Test tylko na postoju.
Weryfikacja: test składni JS i JSON; nie przeprowadzono testu na BMW MGU. W przypadku niepowodzenia potrzebne logi samej aplikacji (M3DG), log Store opisuje tylko instalację.
