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
pnpm run dev
```

La aplicación local se abre normalmente en `http://localhost:5173`. En desarrollo, el editor usa el propietario configurado en `wrangler.jsonc` sin pasar por Cloudflare Access.

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
