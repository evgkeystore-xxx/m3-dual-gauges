M3 DUAL GAUGES 0.1.2 — POPRAWKA STARTU (TESTOWA)

Poprawki względem lokalnej wersji 0.1.1:
- kolejka otwarcia aplikacji, jeżeli kliknięcie nastąpi przed gotowością RHMI
- ochrona przed wielokrotną inicjalizacją
- szczegółowe komunikaty logowania M3DG przy otwarciu i rejestracji
- wersja 0.1.2 w manifestach, co umożliwia aktualizację już zainstalowanej 0.1.1
- nie zmieniono identyfikatora aplikacji ani jej UUID

Wgraj ZAWARTOŚĆ ZIP do głównego katalogu repozytorium GitHub, z zachowaniem ścieżek (bez dodatkowego folderu).
W MGU Store odśwież źródło 'evgkeystore-xxx/m3-dual-gauges' i zainstaluj aktualizację 0.1.2.

To kompilowalny projekt źródłowy OAP, lecz nie został zweryfikowany na Twoim samochodzie.
Na obecnym etapie ekran RHMI wyświetla proste cyfrowe pola, nie gotowe wskazówkowe zegary.
Odczyt RPM/prędkości zależy od dostępności odpowiednich interfejsów SOME/IP.
Próby uruchamiania i obsługi wykonuj wyłącznie na postoju.
