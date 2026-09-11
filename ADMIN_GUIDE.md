# Panel privado del portafolio

## Cómo entrar

1. Abre la dirección pública del portafolio.
2. Añade `/editor` al final de la dirección. El panel no aparece enlazado en ninguna parte pública ni se incluye en buscadores.
3. Pulsa **Iniciar sesión con ChatGPT**.
4. Usa la cuenta `alejandroug2608@gmail.com`. El servidor verifica el identificador interno de esa cuenta; conocer la URL o el correo no concede acceso.

## Qué puedes administrar

- **Proyectos:** título y descripción en inglés y español, categoría, resultado, puntos del caso, tecnologías, enlaces, orden, estado destacado y publicación.
- **Archivos:** imágenes, GIF y videos de hasta 100 MB. Incluye texto alternativo para accesibilidad.
- **Secciones:** bloques bilingües con encabezado, texto, enlace, imagen o video, orden y estado de publicación.
- **Apariencia:** los dos colores neón principales, intensidad de movimiento, título, descripción y disponibilidad de la portada en ambos idiomas.

Los cambios se guardan al pulsar el botón correspondiente. **Publicado** muestra el contenido al público; al desactivarlo, el contenido permanece guardado pero deja de aparecer.

## Dónde se guardan los datos

El sitio usa **Cloudflare D1**, una base de datos SQLite administrada, para proyectos, secciones y preferencias visuales. Las imágenes y videos se almacenan en **Cloudflare R2**, que está diseñado para archivos grandes. El tema y el idioma elegidos por cada visitante se recuerdan solamente en su navegador.

El código permanece bajo control de versiones en el repositorio privado asociado al sitio. No hace falta instalar extensiones de Visual Studio para usar el panel.
