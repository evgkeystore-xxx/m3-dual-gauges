# Pops Controller 2.7.0 – natywny MGU iDrive 8

Zmodyfikowano tylko aplikację `ks_pops_controller`. Pozostałe dwie aplikacje i M3 Suite Diagnostics zachowano z poprzedniego pakietu.

`apps/ks_pops_controller/ks_pops_controller@2.7.0.tgz` jest rzeczywistym instalatorem MGU. Wewnątrz: moduł `renderer/runtime/ui27.js` rysujący *osobne* elementy MGU, aktywne obszary dotykowe i suwaki oraz `ui27assets.js` z odrębnymi ikonami i dekoracyjnymi grafikami z przesłanego archiwum. Nie zawiera zdjęcia całego interfejsu używanego jako tło.

`DESIGN_SOURCE/popscontrol` – oryginalny HTML, CSS, JS i grafiki z przesłanego ZIP-a, do porównania wyglądu. Pliki te nie są interpretowane przez MGU.

Po rozpakowaniu prześlij całą zawartość do głównego katalogu istniejącego repozytorium na GitHubie, usuń stary `ks_pops_controller@2.6.0.tgz` i odśwież MGU Store.

Ważne: nie jest to gwarantowane 1:1 piksel w piksel, ponieważ MGU nie obsługuje HTML/CSS jako natywnego UI; układ został przeniesiony do rysowanych elementów renderera. Nie przeprowadzono testu w fizycznym BMW.

Pops / Flame Mode w tej wersji służą do lokalnych profili, bez zapisu do DME. Nie ma flashowania, przełączania map ani kopiowania mapy ECU. Rzeczywiste połączenie kamery OEM nie zostało potwierdzone.
