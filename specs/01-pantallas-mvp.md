# 01 — Pantallas MVP de Arcade Vault

**Estado:** Approved
**Depende de:** —
**Fecha:** 2026-09-21

**Objetivo:** Portar las 5 pantallas visuales del prototipo estático en `references/templates/` (biblioteca, detalle de juego, reproductor, autenticación, salón de la fama) a rutas reales de Next.js App Router, sin implementar lógica real de ningún juego.

## Alcance

**Incluye:**

- Ruteo real con App Router: `/` (biblioteca), `/juego/[id]` (detalle), `/jugar/[id]` (reproductor), `/auth` (login/registro), `/salon` (salón de la fama).
- Barra de navegación (`Nav`) persistente en el layout raíz, con menú móvil (hamburguesa + panel lateral) y contador de créditos estático en `03`.
- Estado de sesión de usuario mock vía `localStorage` (clave `av_user`), compartido entre Nav, Auth, reproductor y salón mediante un contexto de React (`AuthProvider`).
- Guardado de puntajes mock vía `localStorage` (clave `av_scores`) desde la pantalla de reproductor.
- Simulación visual del reproductor (puntaje autoincremental por `setInterval`, subida de nivel, pausa, fin de partida, formulario de iniciales) tal como en `reproductor.jsx` — es una demo de la pantalla, no un juego jugable.
- Datos mock de juegos, categorías, jugadores y tablas de puntuación (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) portados a TypeScript.
- Estilos: reutilizar y completar `app/globals.css` a partir de `references/templates/styles.css` (CSS custom con variables `--cyan`, `--magenta`, etc.), no Tailwind.
- Componentes compartidos en `components/`: `Nav`, `GameCard`, `Leaderboard` (tabla de puntuaciones del detalle), `Podium` + tabla del salón, `AuthProvider`.

**No incluye:**

- Lógica real de ningún juego (canvas, física, input de teclado/táctil real). El "arena" del reproductor es decorativo (igual que `.game-arena` del template).
- Backend, API routes, base de datos o autenticación real. Todo es mock client-side.
- Login social real (los botones GOOGLE/GITHUB son decorativos, sin `onClick` funcional, igual que el template).
- Internacionalización (todo el copy queda en español, tal como el template).
- Tests automatizados (no hay test runner configurado en el proyecto).
- Accesibilidad avanzada más allá de lo que ya trae el template (atributos `aria-label` existentes se mantienen, no se auditan nuevos).

## Modelo de datos

Todo vive en `app/data.ts` (mock, sin persistencia real salvo lo indicado):

```ts
export type GameId =
  | "bloque-buster"
  | "caida"
  | "serpentina"
  | "gloton"
  | "invasores"
  | "rocas"
  | "ranaria"
  | "duelo-pixel";

export interface Game {
  id: GameId;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de fondo, ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export const PLAYERS: string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Estado de sesión (no en `data.ts`, vive en `components/AuthProvider.tsx`):

```ts
export interface AuthUser {
  name: string;
}
// Contexto: { user: AuthUser | null; login: (u: AuthUser | null) => void; signOut: () => void }
// Persistencia: localStorage["av_user"]
```

Puntajes guardados (mock, escritos por el reproductor, no leídos por ninguna otra pantalla en este MVP):

```ts
// localStorage["av_scores"]: Array<{ game: GameId; score: number; name: string; at: number }>
```

## Plan de implementación

1. **`app/data.ts`** — portar `GAMES`, `CATS`, `PLAYERS`, `seededScores` desde `references/templates/data.jsx` a TypeScript tipado.
2. **`app/globals.css`** — diffear contra `references/templates/styles.css` y completar cualquier clase/regla faltante (el archivo actual ya tiene ~965 líneas vs 950 del template; verificar equivalencia, no reescribir desde cero).
3. **`components/AuthProvider.tsx`** — contexto cliente que expone `user`, `login`, `signOut`, hidrata desde `localStorage["av_user"]` en el mount y persiste cambios. Envolver `app/layout.tsx` con este provider.
4. **`components/Nav.tsx`** — portar `nav.jsx`: logo, links activos por ruta (`usePathname`), contador de créditos estático, botón de sesión (login/nombre de usuario), menú móvil con panel lateral. Usa `AuthProvider` para `user`/`signOut` y `next/link` + `usePathname` para navegación/estado activo en vez de la prop `route` del template.
5. **`app/page.tsx`** — reemplazar el contenido actual por la pantalla de biblioteca: portar `biblioteca.jsx` (`Library` + `GameCard` búsqueda, chips de categoría, grilla de tarjetas con tilt al mouse). `GameCard` va a `components/GameCard.tsx`; el click navega con `next/link` a `/juego/[id]`.
6. **`app/juego/[id]/page.tsx`** — portar `detalle.jsx` (`GameDetail`): info del juego, stats, botón "JUGAR AHORA" (link a `/jugar/[id]`), `components/Leaderboard.tsx` con `seededScores`. `params` es una Promise (Next 16): resolver con `await params` (Server Component) o `use(params)` si se necesita client-side.
7. **`app/jugar/[id]/page.tsx`** — portar `reproductor.jsx` (`GamePlayer`) como Client Component: HUD (jugador, puntaje, vidas, nivel), simulación con `setInterval`, pausa, fin de juego con modal, formulario de iniciales que llama a `onSaveScore` (escribe en `localStorage["av_scores"]`), botones "JUGAR DE NUEVO" / "VOLVER AL VAULT". Usa `AuthProvider` para el nombre por defecto.
8. **`app/auth/page.tsx`** — portar `auth.jsx` (`Auth`): tabs iniciar sesión/crear cuenta, formulario, botón "jugar como invitado", botones sociales decorativos. Al enviar, llama a `login()` del `AuthProvider` y redirige a `/` con `useRouter`.
9. **`app/salon/page.tsx`** — portar `salon.jsx` (`HallOfFame`): tabs por juego, podio top 3, tabla de puntuaciones, fila "tu mejor marca" si hay `user` en el `AuthProvider`. Extraer podio+tabla en `components/Podium.tsx` y/o reusar `Leaderboard` si el formato de fila coincide; si no coincide (el salón usa columnas con fecha visible siempre, el detalle no), mantenerlos como componentes separados en vez de forzar una abstracción común.
10. **`app/layout.tsx`** — envolver `children` con `AuthProvider` y renderizar `<Nav />` antes de `{children}` y el footer (`© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`) después, igual que `app.jsx`.
11. Verificación manual en navegador (`npm run dev`): recorrer las 5 pantallas, probar login/logout, guardar un puntaje, abrir/cerrar el menú móvil, filtrar/buscar en biblioteca.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] `/` muestra la grilla de juegos con buscador y chips de categoría funcionales (filtran la lista en tiempo real).
- [ ] Click en una tarjeta o en "JUGAR" navega a `/juego/[id]` con la info correcta del juego.
- [ ] `/juego/[id]` muestra tags, descripción, stats, tabla de mejores puntuaciones y botones "JUGAR AHORA" (va a `/jugar/[id]`) y "VOLVER AL VAULT" (va a `/`).
- [ ] `/jugar/[id]` incrementa el puntaje automáticamente, permite pausar/reanudar, y al terminar muestra el modal con el puntaje final y el formulario para guardar iniciales; tras guardar, el puntaje queda en `localStorage["av_scores"]`.
- [ ] `/auth` permite alternar entre "iniciar sesión" y "crear cuenta", y al enviar el formulario o elegir "jugar como invitado" redirige a `/` actualizando el estado de sesión en el Nav.
- [ ] `/salon` muestra el podio top 3 y la tabla completa por cada juego seleccionable en los tabs; si hay sesión iniciada, muestra la fila "tu mejor marca".
- [ ] El Nav muestra "Iniciar Sesión" sin sesión y el nombre de usuario con opción de cerrar sesión cuando hay sesión, en desktop y en el panel móvil.
- [ ] Recargar la página (F5) en cualquier ruta mantiene la sesión (persistida en `localStorage`) y renderiza la pantalla correcta según la URL.
- [ ] Ninguna pantalla implementa lógica de juego real (input de teclado, colisiones, física); el reproductor es la simulación visual descrita en el plan.

## Decisiones tomadas y descartadas

- **Ruteo real de App Router en vez de hash routing SPA** — el template usa `location.hash` porque es un mockup HTML estático sin backend; en un proyecto Next.js real conviene rutas reales para deep-linking, SEO y porque es el patrón idiomático de Next 16. Descartado: replicar el hash routing tal cual, por no aprovechar el App Router.
- **Mantener la simulación del reproductor** — aunque el pedido dice "sin implementar ningún juego", el `setInterval` que sube el puntaje es parte de la demo visual de esa pantalla (HUD, pausa, fin de juego), no un juego jugable con input del usuario. Se mantiene para que la pantalla se vea "viva" como en el template.
- **`localStorage` como mock de persistencia** — no hay backend en este MVP; se seleccionó mantener el mismo mecanismo del template (`av_user`, `av_scores`) en vez de dejar los formularios sin efecto, para que el flujo de login/guardado de puntaje se sienta completo.
- **CSS custom del template en vez de Tailwind** — `app/globals.css` ya tiene un tamaño casi idéntico al `styles.css` del template (965 vs 950 líneas), indicando que ya fue portado en un commit previo; se completa/verifica ese archivo en vez de reescribir el sistema visual en utilidades Tailwind.
- **`app/data.ts` en la raíz de `app/`** en vez de `lib/data.ts`, por preferencia explícita del usuario.
- **`components/` en la raíz del repo** para componentes compartidos entre rutas (Nav, GameCard, Leaderboard, Podium, AuthProvider), siguiendo la convención estándar de Next.js App Router.
- **No abstraer `Leaderboard` y la tabla del salón en un único componente** si sus columnas/estados visuales no coinciden exactamente — se evalúa en el paso 9 del plan; si difieren, quedan como dos componentes separados en vez de forzar una prop compartida artificial.

## Riesgos identificados

- **`params` como Promise en Next 16**: las rutas dinámicas (`/juego/[id]`, `/jugar/[id]`) deben resolver `params` con `await` (Server Component) o `use()` (Client Component) — un olvido rompe el build. El reproductor necesita ser Client Component por sus hooks de estado/efectos, así que debe usar `use(params)`.
- **Estado de sesión compartido entre rutas**: al pasar de un modelo de un solo `App` con estado en memoria a rutas reales, el `AuthProvider` debe hidratarse correctamente en cada navegación sin parpadeos (flash de "sin sesión" antes de leer `localStorage`); revisar visualmente al implementar.
