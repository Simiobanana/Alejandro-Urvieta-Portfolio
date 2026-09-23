# Yggdrasil celta — alternativa ilustrada

Ilustración original generada con la herramienta integrada de imágenes, orientada por la referencia aportada por Alejandro. El prompt íntegro y la procedencia están en `PROMPT.md`. El PNG maestro se conserva sin modificaciones en esta carpeta.

La web usa `public/art/yggdrasil/yggdrasil-celtic.webp` (458.074 bytes) y la variante móvil de 960 px (173.976 bytes). Ambas son conversiones WebP del original con Sharp, sin cambiar el contenido. No se descarga el PNG maestro en la web.

`app/yggdrasil-art.tsx` aporta el movimiento de profundidad, solo con ratón y efectos habilitados. `app/yggdrasil-art.css` integra los bordes con el cielo y añade partículas CSS. Los marcadores comparten la misma transformación que la pintura; en teléfono no se intercepta el gesto de desplazamiento. Las posiciones iniciales están en `app/immersive-tree.tsx`, y las coordenadas manuales del editor siguen teniendo prioridad.

Arte 2D es la presentación inicial. El selector permite volver al render ligero o al modelo 3D. Se mantienen el `.blend`, el generador y los GLB en `assets-source/yggdrasil/`; sus raíces se ajustaron al contorno elíptico y a la superficie superior de la isla. El modelo 3D solo se solicita al seleccionarlo.
