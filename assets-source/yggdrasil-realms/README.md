# Yggdrasil de tres reinos — estudio 3D

## Alcance

Composición con tres reinos: observatorio de programación y herramientas, santuario de arte técnico y VFX, y umbral de videojuegos y experiencias. El tronco continúa hasta la copa; los contrafuertes de la base se integran dentro del tronco y cada isla descansa sobre una rama que se divide en raíces alrededor de su base. Se retiraron las escaleras sobrepuestas del observatorio. El sendero del umbral permanece dentro de su isla y desemboca en el portal.

Geometría y normal de corteza originales, producidos localmente mediante Blender 3.6. Sin proveedor de pago ni modelos descargados. El generador conserva las utilidades geométricas de la primera versión y define una composición nueva independiente. Los modelos anteriores siguen en sus directorios originales; el primer observatorio de este estudio se conserva en Git en `fad0211`. El CLI game-dev no está disponible en este equipo: las comprobaciones se realizan con Blender y el navegador.

## Entregables

- `deliverables/Yggdrasil_Three_Realms.blend`: fuente editable, iluminación y cámaras de estudio.
- `deliverables/yggdrasil-realms.glb`: modelo web autónomo con Draco, doce mallas/materiales y cuatro anclajes semánticos.
- `deliverables/composition.png`, `composition.webp`, `observatory-detail.png`, `sanctuary-detail.png`, `threshold-detail.png`: renders de estudio reales del modelo.
- `deliverables/metrics.json` y `validation.json`: presupuesto y verificación independiente del GLB reimportado en Blender.

Presupuesto: máximo 120.000 triángulos, 1,6 MB de GLB y doce materiales. La composición tiene 119.342 triángulos y pesa 1.370.372 bytes. La textura de normales original está empaquetada. Código de generación: `build_realms.py`. Verificación: `verify.py`.

## Vista web

Integrado en la vista inmersiva del portafolio principal (`/#work`) mediante `app/realm-explorer.tsx`. La ruta `/yggdrasil-study` se conserva como referencia independiente y está excluida de indexación por robots. Ambas vistas comparten el renderizador `app/realm-scene.tsx` y las definiciones de reinos en `lib/portfolio-realms.ts`.

La página principal utiliza el idioma, día/noche, efectos, categorías, colores y orden del contenido del editor existente. Los proyectos se abren en sus casos completos sin perder el reino seleccionado. La vista ligera utiliza el render WebP de esta misma composición y puede elegirse manualmente. Las posiciones X/Y del árbol anterior se conservan en el editor como datos de la versión anterior y no alteran los anclajes de esta escena.

Renderizado WebGL con sombras, entorno de iluminación, transición de cámara a cada reino y modo día/noche. Cada reino muestra proyectos del contenido público existente y enlaza a sus casos completos. Máximo 30 fotogramas por segundo, resolución limitada, pausa fuera de pantalla, control de efectos y respeto por movimiento reducido. El control táctil permite desplazamiento vertical: la rotación manual se reserva al ratón. El render WebP es la alternativa si WebGL no funciona. No se garantiza una velocidad idéntica en todos los equipos.

Para regenerar: ejecutar Blender en segundo plano con `--python assets-source/yggdrasil-realms/build_realms.py`; después ejecutar `verify.py` y copiar el GLB y `composition.webp` a `public/models/yggdrasil-realms/`. El generador sobrescribe únicamente los entregables de este estudio.
