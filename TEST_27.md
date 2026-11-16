# Lokalna kontrola Pops Controller 2.7

- Rysowanie 4 trybów x 4 ekrany, dodatkowo debug standardowy i pięciokolumnowy: 18/18 przebiegów bez wyjątku JavaScript.
- Flame Mode widoczny tylko w Sport+ / P/N; każdy z tych dwóch ekranów ma 3 suwaki Flame.
- Trzy suwaki Pops i dwa uchwyty RPM rysowane jako natywne, oddzielnie klikalne elementy, bez fotografii całego ekranu.
- Ekran kamery z przyciskiem X oraz komunikatem o braku potwierdzonego dostępu do obrazu OEM.
- Ustawienia z przełączaniem modelu BMW, lokalną kopią ustawień i dostępem do rzeczywistych logów.
- Logi i parametry LIVE są źródłami z istniejącej implementacji (nie wartości sztucznie wpisane do UI).
- Brak zmian do gateway.js / telemetry.js / MHD ECU.
- Odnotowane ograniczenie: widok natywny MGU nie jest pikselowo identyczny z przeglądarkowym HTML/CSS, ponieważ MGU nie uruchamia tej strony jako WebView. Nie przetestowano na rzeczywistym samochodzie.
