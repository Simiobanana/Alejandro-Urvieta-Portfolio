# Alejandro Urvieta Portfolio

Portafolio bilingüe de Alejandro Urvieta, desarrollado con Next.js/Vinext y desplegado como Cloudflare Worker.

## Direcciones

- Sitio público: <https://alejandrourvieta.com>
- Editor privado: <https://alejandrourvieta.com/editor>
- Repositorio: <https://github.com/Simiobanana/Alejandro-Urvieta-Portfolio>

El editor y las rutas `/api/admin/*` están protegidos por Cloudflare Access. Solo la cuenta de Cloudflare asociada con `alejandroug2608@gmail.com` tiene autorización. La página pública y sus API de lectura no requieren inicio de sesión.

## Acceder al editor

1. Abre <https://alejandrourvieta.com/editor>.
2. Pulsa **Cloudflare** en la pantalla de acceso.
3. Inicia sesión con la cuenta de Cloudflare autorizada.
4. Usa las pestañas **Proyectos**, **Secciones** y **Apariencia**.
5. Pulsa **Salir** al terminar, especialmente en una computadora compartida.

La sesión dura 24 horas. El editor permite crear y modificar contenido bilingüe, publicar u ocultar proyectos, organizar secciones, cambiar colores y cargar imágenes o videos de hasta 90 MB.

Los ocho proyectos y las seis secciones originales forman parte de la biblioteca: puedes editarlos, ocultarlos o eliminarlos. El sitio no vuelve a añadirlos desde el código. Ocultar es reversible; eliminar requiere confirmación y borra el registro.

### Galerías, posición y apariencia

- El primer archivo de una galería es la portada. Arrastra el asa para ordenar; en teléfono o con teclado usa las flechas. Puedes asignar una miniatura a cada video.
- El orden menor aparece primero, tanto en proyectos como en secciones. La lista de posición señala dónde quedará el borrador. Guarda para aplicar los cambios.
- Apariencia tiene paletas independientes para día y noche, muestra de colores y relación de contraste. Los cambios de la vista previa no se publican hasta guardar.
- El movimiento ambiental tiene tres niveles. El visitante elige Auto, Sí u Off/No. Auto reduce los efectos en equipos con pocos núcleos/memoria o ahorro de datos; no detecta directamente si Brave tiene aceleración por hardware. Se respeta siempre la preferencia de movimiento reducido del sistema.
- La duración de las previsualizaciones es de 0 a 60 segundos. Cero conserva las portadas visibles; sin efectos también permanecen visibles. Se pueden revelar otra vez con el botón de cada tarjeta.
- Se aceptan JPG, PNG, WebP, GIF, MP4 y WebM. SVG no se admite en las cargas del editor. La portada SVG de Ká Hai es un recurso estático revisado y representa un resumen, no una captura del sitio.

### Seguridad y límites

El servidor verifica la firma, emisor, audiencia, caducidad y correo del token de Cloudflare Access. Las escrituras comprueban el origen y validan tamaños, tipos y enlaces. Los borradores no aparecen en las API públicas. Los archivos multimedia publicados son públicos: no cargues documentos confidenciales.

Ningún sitio tiene seguridad garantizada. Mantén protegidas las cuentas de Cloudflare/GitHub, actualiza dependencias y conserva copias de D1/R2. La política de contenido conserva scripts inline requeridos por el renderizador; estas comprobaciones no sustituyen una auditoría independiente.

## Servicios

- **Cloudflare Workers:** aplicación y renderizado.
- **Cloudflare D1:** proyectos, secciones y ajustes editables.
- **Cloudflare R2:** imágenes y videos cargados desde el editor.
- **Cloudflare Access:** autenticación y autorización del panel privado.
- **GitHub:** historial y control de versiones.

## Desarrollo local

Requiere Node.js 22 o posterior y pnpm.

```powershell
pnpm install
pnpm exec wrangler d1 execute alejandro-urvieta-portfolio --local --file drizzle/0000_thankful_nitro.sql
pnpm exec wrangler d1 execute alejandro-urvieta-portfolio --local --file drizzle/0001_wooden_ares.sql
pnpm exec wrangler d1 execute alejandro-urvieta-portfolio --local --file drizzle/0002_romantic_karnak.sql
pnpm exec wrangler d1 execute alejandro-urvieta-portfolio --local --file drizzle/0003_editable_content.sql
pnpm exec wrangler d1 execute alejandro-urvieta-portfolio --local --file drizzle/0004_project_media.sql
pnpm run dev
```

La aplicación local se abre normalmente en `http://localhost:5173`. En desarrollo, el editor usa el propietario configurado en `wrangler.jsonc` sin pasar por Cloudflare Access.

Ejecuta las migraciones anteriores una sola vez sobre una base local nueva. Los videos de R2 requieren una copia local o una carga desde el editor local. No vuelvas a aplicar las migraciones de esquema sobre producción: ya están aplicadas. Los scripts de pruebas en `scripts/*-tests.mjs` usan únicamente localhost y datos desechables.

Antes de publicar:

```powershell
pnpm run lint
pnpm run build
```

## Publicar cambios

Inicia sesión en Cloudflare con Wrangler si la sesión expiró:

```powershell
pnpm exec wrangler login
```

Después despliega y guarda el cambio en GitHub:

```powershell
pnpm run deploy
git add .
git commit -m "Describe el cambio"
git push origin main
```

`wrangler.jsonc` contiene los nombres e identificadores de D1, R2, los dominios y las variables no secretas. No guardes contraseñas, códigos de acceso, llaves privadas ni tokens en el repositorio.

## Archivos principales

- `app/page.tsx`: página principal.
- `app/editor/`: panel administrativo.
- `app/api/projects`, `sections` y `settings`: lectura pública.
- `app/api/admin/`: operaciones protegidas de escritura y cargas.
- `db/schema.ts`: esquema de D1.
- `drizzle/`: migraciones de base de datos.
- `wrangler.jsonc`: configuración de Cloudflare.

## Recuperación

El código puede clonarse desde el repositorio privado:

```powershell
git clone https://github.com/Simiobanana/Alejandro-Urvieta-Portfolio.git
cd Alejandro-Urvieta-Portfolio
pnpm install
```

El sitio ya no depende del dominio ni del inicio de sesión de ChatGPT Sites.
