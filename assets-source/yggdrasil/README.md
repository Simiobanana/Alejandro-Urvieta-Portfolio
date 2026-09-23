# Yggdrasil — Alejandro Urvieta

Modelo original construido en Blender 3.6.22 para el portafolio: tronco entrelazado, raíces extendidas, copa asimétrica, follaje jade/bronce, savia dorada y semillas luminosas turquesa. Las referencias visuales orientaron el estilo; no se incorporaron imágenes ni mallas de terceros al modelo.

## Archivos

- `deliverables/Yggdrasil_Alejandro_Urvieta.blend`: fuente editable con seis mallas/materiales, doce anclajes y estudio de iluminación separado. La textura de corteza está empaquetada.
- `deliverables/yggdrasil-web.glb`: 108.454 triángulos; 1.170.436 bytes.
- `deliverables/yggdrasil-mobile.glb`: 55.779 triángulos; 940.864 bytes.
- `deliverables/yggdrasil-poster.webp`: render transparente usado durante la carga o sin WebGL.
- `deliverables/yggdrasil-preview.png` y `yggdrasil-three-quarter.png`: vistas de estudio en Blender.
- `deliverables/anchors.json`: posiciones de los doce nodos `ProjectAnchor_01` a `ProjectAnchor_12`, en coordenadas glTF Y-up.

Los GLB contienen seis primitivas de dibujo y una sola textura de normales de 512 × 512. La geometría usa compresión Draco. Los archivos son autónomos; el decodificador de la web se aloja en `public/draco`, sin CDN. El `.blend` usa Z-up; Blender convierte a Y-up al exportar.

## Edición y regeneración

Abrir el `.blend` en Blender y trabajar en la colección `YGGDRASIL | web asset`. La colección `STUDIO | render only` contiene cámara y luces, que no forman parte del GLB. Los puntos `ProjectAnchor_*` se pueden reposicionar y se pueden añadir otros. Los anclajes no crean proyectos automáticamente: el contenido se gestiona en el editor del sitio.

Para reconstruir desde los parámetros del script (sobrescribe los entregables generados):

```powershell
& 'C:/Program Files/Blender Foundation/Blender 3.6/blender.exe' --background --python assets-source/yggdrasil/build_yggdrasil.py
& 'C:/Program Files/Blender Foundation/Blender 3.6/blender.exe' --background --python assets-source/yggdrasil/verify_exports.py
```

Después de regenerar, copiar ambos GLB y el WebP a `public/models/yggdrasil/`. Conservar una copia aparte de cualquier edición manual antes de ejecutar el generador.

## Integración y rendimiento

`app/yggdrasil-model.tsx` carga el modelo al acercarse a la sección, usa la versión reducida en pantallas de hasta 700 px y limita la resolución de render y la animación a 30 fps. Deja de dibujar fuera de pantalla o con la pestaña oculta. Con efectos apagados, solo vuelve a dibujar al cambiar el tamaño o durante la transición de iluminación. El movimiento del puntero y el cambio de tema no recrean el contexto ni recargan el GLB.

`app/immersive-tree.tsx` proyecta los anclajes sobre los accesos a proyectos; respeta las coordenadas manuales del editor. En teléfono también ofrece una lista legible de accesos. Sin WebGL, con ahorro de datos o movimiento reducido se utiliza el render WebP del mismo árbol. La vista de estudio emplea bloom; el render web utiliza iluminación directa y materiales emisivos sin postprocesado de bloom para reducir coste.

## Validación y límites

Los informes `*.validation.json` registran la validación estructural de Khronos: cero errores y un aviso por tangentes calculadas en tiempo de ejecución. Este validador no inspecciona el contenido Draco comprimido; `roundtrip-validation.json` verifica por separado su descompresión en Blender, geometría finita y doce anclajes. También se verificó la carga real en navegador. La adaptación a 390 px es una prueba de viewport, no una medición en un iPhone físico.

El aspecto es estilizado, con hojas geométricas. El presupuesto de polígonos y la compresión reducen la carga, pero no garantizan una tasa de fotogramas idéntica en todos los equipos. El render WebP conserva la silueta sin coste 3D.

Draco es una dependencia de Google bajo Apache 2.0; su licencia se conserva en `public/draco/LICENSE`. La geometría y la textura del árbol se generaron específicamente para este proyecto.

La segunda revisión añade una isla continua con estratos, vegetación y dos cascadas, y ocho ramas de acceso explícitas. El generador también escribe lib/yggdrasil-layout.json con la proyección de los anclajes en el render ligero, para mantenerlos alineados con el mismo árbol. El selector público permite comparar Ligera/3D y Runas/Orbes sin cambiar los ajustes del editor. El agua usa una modulación de luz en el shader y la bruma utiliza transformaciones CSS; ambos respetan el control de efectos.
