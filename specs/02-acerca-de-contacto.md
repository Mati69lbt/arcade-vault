# 02 — Acerca de + formulario de contacto (Resend)

**Estado:** Implementado
**Depende de:** 01
**Fecha:** 2026-09-21

**Objetivo:** Portar la pantalla "Acerca de" de `references/templates/home-about/about.jsx` a `/acerca-de` y conectar su formulario de contacto a un envío real de correo mediante Resend a través de un route handler propio.

## Alcance

**Incluye:**

- Ruta `/acerca-de` con la sección "Acerca de" (hero, misión, highlights) y la sección "Contacto" (formulario), portadas desde `about.jsx`.
- Link "Acerca de" agregado al `Nav` (desktop y panel móvil), apuntando a `/acerca-de`, siguiendo el mismo patrón (`Link` + `isActive`) que los demás ítems.
- Envío real del formulario: `POST /api/contact` (route handler) que valida los campos, llama a Resend server-side y devuelve éxito/error.
- Validación de formato de email en cliente (regex simple), además de la validación existente de "campos no vacíos".
- Estado de error en el formulario cuando Resend falla o el route handler responde error, sin perder lo escrito por el usuario, con opción de reintentar.
- Estilos: completar `app/globals.css` con las reglas de `.about-*`, `.contact-*`, `.highlight*`, `.terminal-success`/`.term-*`, `.tip*` faltantes de `references/templates/home-about/styles.css`.
- Dependencia nueva: `resend` en `package.json`.
- Variables de entorno (sin valores reales, se completan en `.env.local` al implementar): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

**No incluye:**

- Protección anti-spam (honeypot, rate-limit, captcha).
- Envío de un correo de confirmación al remitente (solo se notifica al destino configurado en `CONTACT_TO_EMAIL`).
- Plantillas de correo con diseño HTML propio (texto plano o HTML mínimo generado inline en el route handler).
- Verificación de dominio propio en Resend ni configuración de DNS — se asume `CONTACT_FROM_EMAIL` usable tal cual (p. ej. dominio de prueba de Resend) al momento de implementar.
- Guardado de los mensajes de contacto en ninguna base de datos ni `localStorage`.
- Internacionalización (copy en español, igual que el resto del sitio).

## Modelo de datos

No se agregan tipos ni estructuras a `app/data.ts`. Estado local del formulario (en el componente de la página):

```ts
interface ContactForm {
  name: string;
  email: string;
  msg: string;
}

type ContactStatus = "idle" | "sending" | "sent" | "error";
```

Contrato del endpoint:

```ts
// POST /api/contact
// body: { name: string; email: string; msg: string }
// 200: { ok: true }
// 400/500: { ok: false; error: string }
```

## Plan de implementación

1. **`package.json`** — agregar dependencia `resend` (`npm install resend`).
2. **`.env.local`** (no versionado) — documentar en el spec las claves esperadas: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. Si `.env.example` no existe, crearlo con las claves sin valores.
3. **`app/globals.css`** — diffear contra `references/templates/home-about/styles.css` y agregar las ~45 reglas de `.about-*`, `.contact-*`, `.highlight*`, `.terminal-success`/`.term-*`, `.tip*` que faltan.
4. **`app/api/contact/route.ts`** — `POST` handler: valida `name`/`email`/`msg` no vacíos y formato de email server-side (defensa además de la validación de cliente); si falla, responde 400. Si pasa, instancia `Resend` con `process.env.RESEND_API_KEY` y envía el correo (`to: CONTACT_TO_EMAIL`, `from: CONTACT_FROM_EMAIL`, `subject` con el nombre del remitente, cuerpo con nombre/email/mensaje). Responde 200 `{ ok: true }` en éxito o 500 `{ ok: false, error }` si Resend lanza error.
5. **`app/acerca-de/page.tsx`** — Client Component portado desde `about.jsx`: hero + highlights (con `HighlightIcon` inline o en el mismo archivo, igual que el template) + `useReveal` (reutilizar el hook ya existente en `app/page.tsx`, extraerlo a un helper compartido si aplica o duplicarlo igual que hace el template). El formulario de contacto usa `ContactForm`/`ContactStatus`: en `onSubmit`, valida campos no vacíos + regex de email (si falla, dispara el `shake` existente), y hace `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })`. Mientras está en curso, deshabilita el botón de envío. En éxito, muestra el `terminal-success` existente (igual que el template). En error, muestra una variante del terminal con `[FAIL]` y un botón "REINTENTAR" que vuelve a `idle` sin borrar `form`.
6. **`components/Nav.tsx`** — agregar `<Link href="/acerca-de" className={isActive("acerca-de") ? "active" : ""}>Acerca de</Link>` en el bloque desktop y en el panel móvil, en la misma posición relativa que tiene en `nav.jsx` (entre "Biblioteca"/"Salón de la Fama" y el login).
7. Verificación manual en navegador (`npm run dev`): abrir `/acerca-de` desde el Nav, enviar el formulario con datos válidos y confirmar que llega el correo (o que el route handler responde 200), probar el caso de error (p. ej. `RESEND_API_KEY` inválida) y confirmar que se muestra el estado de error sin perder lo escrito, y validar que un email con formato inválido dispara el shake sin llamar al endpoint.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] `/acerca-de` es alcanzable desde un link "Acerca de" en el `Nav`, tanto en desktop como en el panel móvil, y queda marcado como activo en esa ruta.
- [ ] La sección "Acerca de" muestra el hero, la misión y los tres highlights con sus iconos, igual que el template.
- [ ] Enviar el formulario con los tres campos completos y un email válido dispara un `POST /api/contact`, y si Resend responde éxito, la UI muestra el `terminal-success` con el nombre en mayúsculas.
- [ ] Si algún campo está vacío o el email tiene formato inválido, el formulario no envía la request y dispara la animación de `shake` existente.
- [ ] Si `POST /api/contact` responde error (Resend falla o hay error de red), la UI muestra un estado de error distinguible con opción de reintentar, sin perder los valores escritos por el usuario.
- [ ] El correo realmente llega a la casilla configurada en `CONTACT_TO_EMAIL` al probar con una `RESEND_API_KEY` válida (verificación manual, no automatizada).
- [ ] `RESEND_API_KEY` nunca se referencia ni se expone en código cliente (solo se usa dentro de `app/api/contact/route.ts`).

## Decisiones tomadas y descartadas

- **Route handler propio (`app/api/contact/route.ts`) en vez de Server Action** — mantiene el patrón de `fetch` + estado explícito (`idle/sending/sent/error`) que ya usa el template, y deja claro dónde vive la clave de Resend (nunca en el bundle cliente). Descartado: Server Action, por cambiar el manejo de estado del formulario sin necesidad.
- **Variables de entorno sin valores reales en el spec** — el usuario las completa en `.env.local` al implementar; el spec solo fija los nombres (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`).
- **Estado de error visible en el formulario** — en vez de aparentar éxito siempre, se agrega una variante de error al `terminal-success` existente, porque ocultar un fallo de envío sería engañoso para quien llena el formulario.
- **Validación de email solo en cliente (regex) + validación básica server-side** — se agrega la mínima verificación necesaria para no enviar requests inválidas a Resend; honeypot/rate-limit quedan fuera de alcance por pedido explícito.
- **Ruta `/acerca-de` en vez de `/about`** — consistente con el resto de rutas del sitio en español sin acentos (`/biblioteca`, `/salon`, `/auth`).
- **No tocar `Leaderboard`, `Podium` ni otras pantallas del spec 01** — este spec solo agrega la pantalla y ruta nuevas, y el link en el `Nav`.

## Riesgos identificados

- **`RESEND_API_KEY` ausente o inválida en desarrollo**: el endpoint debe responder error controladamente (500 con `ok: false`) en vez de tirar una excepción no manejada; el formulario debe reflejar ese error en la UI.
- **Dominio de envío no verificado en Resend**: si `CONTACT_FROM_EMAIL` usa un dominio propio sin verificar, Resend puede rechazar el envío; se documenta en el spec pero la verificación de dominio queda fuera de alcance — usar el dominio de prueba de Resend si esto ocurre al implementar.
- **CSS faltante**: si alguna clase de `.about-*`/`.contact-*` no se porta completa, la pantalla puede verse rota visualmente aunque el build pase; se valida con verificación manual en navegador, no con el build.
