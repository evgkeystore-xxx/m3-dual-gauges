M3 DUAL GAUGES 0.1.1 — POPRAWKA BŁĘDU INSTALACJI

Na ekranie MGU wystąpił błąd: package.json files[] names config, which is missing.
W 0.1.1 usunięto z listy files nieistniejący katalog config.
Wersja 0.1.1 nadal jest EKSPERYMENTALNA i nie była sprawdzana w samochodzie.
Nie gwarantujemy poprawnego uruchamiania ani rzeczywistych RPM/km/h.

GITHUB: rozpakuj ZIP, przekaż jego zawartość bez dodatkowego katalogu na root repo.
W repo muszą być mgu-repo.json i apps/m3_dual_gauges/mgu-app.json.
Usuwanie starych plików nie jest konieczne, ale stary artefakt 0.1.0 nie może być wybierany zamiast 0.1.1.

UWAGA: testuj na postoju, nie przy prowadzeniu samochodu.
