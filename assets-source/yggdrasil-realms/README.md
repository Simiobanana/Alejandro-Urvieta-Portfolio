# Yggdrasil de tres reinos — primer estudio 3D

## Alcance

Primera composición para revisar la dirección artística antes de ampliar a tres reinos: árbol rediseñado y observatorio de programación y herramientas. La propuesta aprobada pide silueta orgánica, mundos físicamente sostenidos por ramas, iluminación con profundidad y una cámara que permita acercarse. No se han construido todavía los reinos de arte técnico ni de experiencias interactivas.

Geometría y normal de corteza originales, producidos localmente mediante Blender 3.6. Sin proveedor de pago ni modelos descargados. El generador conserva las utilidades geométricas de la primera versión y define una composición nueva independiente. Todos los modelos anteriores siguen en sus directorios originales. El CLI game-dev no está disponible en este equipo: las comprobaciones se realizan con Blender y el navegador.

## Entregables

- `deliverables/Yggdrasil_Three_Realms.blend`: fuente editable, iluminación y cámaras de estudio.
- `deliverables/yggdrasil-realms.glb`: modelo web autónomo con Draco, diez mallas/materiales y dos anclajes semánticos.
- `deliverables/composition.png`, `composition.webp`, `observatory-detail.png`: renders de estudio reales del modelo.
- `deliverables/metrics.json` y `validation.json`: presupuesto y verificación independiente del GLB reimportado en Blender.

Presupuesto: máximo 120.000 triángulos, 1,6 MB de GLB y diez materiales. La primera composición final tiene 102.086 triángulos y pesa 1.226.732 bytes. La textura de normales original está empaquetada. Código de generación: `build_realms.py`. Verificación: `verify.py`.

## Vista web

Ruta independiente `/yggdrasil-study`, excluida de indexación por robots. No reemplaza la página principal. Su componente está en `app/yggdrasil-study/`.

Renderizado WebGL con sombras, entorno de iluminación, transición de cámara al observatorio y modo día/noche. Máximo 30 fotogramas por segundo, resolución limitada, pausa fuera de pantalla, control de efectos y respeto por movimiento reducido. El control táctil permite desplazamiento vertical: la rotación manual se reserva al ratón. El render WebP es la alternativa si WebGL no funciona. No se garantiza una velocidad idéntica en todos los equipos.

Para regenerar: ejecutar Blender en segundo plano con `--python assets-source/yggdrasil-realms/build_realms.py`; después ejecutar `verify.py` y copiar el GLB y `composition.webp` a `public/models/yggdrasil-realms/`. El generador sobrescribe únicamente los entregables de este estudio.
