# Activar las reseñas

La página muestra el formulario y las reseñas aprobadas. Para que guarde datos reales:

1. Crea un proyecto en Supabase y abre **SQL Editor**.
2. Ejecuta el archivo `reviews-setup.sql` una sola vez.
3. En **Project Settings → API Keys**, copia la URL del proyecto y la **publishable key** (`sb_publishable_...`).
4. Pégalas en `reviews-config.js`. Esos dos valores están diseñados para usarse en el navegador. **No uses la secret key ni la service_role key**.
5. Sube los archivos de la página a GitHub Pages y prueba enviar una reseña. No deberá aparecer todavía.
6. En Supabase **Table Editor → reviews**, localiza la reseña y cambia `approved` a `true`. Al recargar la página se mostrará públicamente.

Las reseñas y fotos no aprobadas no son visibles para los visitantes. Se pueden adjuntar hasta cinco fotos; el navegador las convierte a JPG y reduce su tamaño antes de enviarlas, lo que también elimina metadatos de ubicación de los originales. El formulario no pide correo ni teléfono. Cualquier visitante puede enviar una reseña pendiente; revisa periódicamente los envíos en Supabase y elimina spam desde el panel. El límite por navegador y el campo oculto reducen envíos automáticos simples, pero no sustituyen una protección de servidor si recibes mucho spam.

## Probar antes de conectar Supabase

Abre `index.html`, llena el formulario, agrega una foto si quieres y pulsa **Enviar reseña**. Se mostrará arriba como **vista de prueba**. No se envía ni se guarda para otros visitantes, y desaparecerá al recargar la página. Al configurar `reviews-config.js`, el sitio usará la base de datos y la aprobación previa en lugar del modo de prueba.
