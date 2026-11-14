M3 DUAL GAUGES • PROTOTYP DLA MGU STORE 0.9.40 / IDRIVE 8

STATUS: Repozytorium źródłowe OAP w strukturze zgodnej z MGU Store. Nieprzetestowane na rzeczywistym MGU.
Obecna aplikacja ma 2 ekrany z odczytami cyfrowymi RPM i km/h; nie ma jeszcze animowanych zegarów na ekranie MGU. Grafiki tarcz to zasoby projektu, a HTML jest podglądem wyłącznie na komputer.

GITHUB:
1. Utwórz publiczne repozytorium GitHub, np. m3-dual-gauges.
2. Prześlij zawartość TEGO folderu do KATALOGU GŁÓWNEGO repozytorium (mgu-repo.json musi być w root).
3. W MGU Store -> Ustawienia -> Źródła dodaj owner/m3-dual-gauges i wybierz gałąź main (branch).
4. Sprawdź, czy aplikacja widoczna jest jako M3 Dual Gauges. Pierwsza instalacja na iDrive 8 może wymagać restartu jednostki.
5. Jeśli Store zgłosi błąd: nie próbuj ręcznych modyfikacji firmware; zachowaj pełny komunikat błędu i sprawdź go przed powtórną próbą.

USB:
Oficjalny instalator MGU Store obsługuje: node mgu-install.js usb-repo <pendrive> <folder>
Polecenie uruchom na komputerze z Node.js 18+; <folder> wskazuje rozpakowany katalog repozytorium z mgu-repo.json.
W MGU Store otwórz stronę USB. NIE kopiuj tego ZIP bezpośrednio, bo ZIP jest kontenerem projektu, nie instalacyjnym tgz.

OGRANICZENIA:
* Nie zostały zweryfikowane identyfikatory usług SOME/IP, schemat wartości ani metoda focusState na tej konkretnej jednostce.
* Ta paczka jest do testu, nie do używania jako wskaźnik podczas jazdy. Nie zastępuje zegarów fabrycznych.
* Jeśli aplikacja nie wystartuje, MGU może automatycznie usunąć wadliwą aplikację po awarii.
* Nie umieszczaj kluczy SSH / tokenów GitHub w repozytorium.

Dokumentacja: https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md
