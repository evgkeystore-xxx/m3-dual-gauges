# Naprawa dotyku M3 Suite

- Zmieniono priorytet socketu renderera: `/run/mgu-render/render.sock` -> fallback `/run/mgu-renderd/renderd.sock`.
- Stary klient mógł połączyć się z innym rendererem, gdy zainstalowane były jednocześnie mgu-render i idrive7-renderd.
- Wcześniej przycisk działał tylko po DOWN+UP. Teraz reaguje na DOWN (lub sam UP), a suwaki na DOWN/MOVE/UP.
- W raporcie: `rendererSocket`, `touchAdvertised`, `touchEvents`, `lastTouch`, `RHMI_FOCUS`, `TOUCH_RAW`, `TOUCH_EMPTY`, `TOUCH_ACTION`.
- Przy `touchAdvertised=false` nie ma dowodu, że renderer przekazuje dotyk. Nie próbuj naprawiać tego przez flash ECU.
- Dotyk ograniczony do y=76..840 (obszar aplikacji); oryginalny pasek klimatyzacji pozostaje poza obszarem.
- Profile Pops są lokalnym DEMO. Suwaki nie zmieniają mapy MHD.
- 0.5.0 / 1.5.0 / 1.2.0 nie były jeszcze testowane na fizycznym MGU.
