# SPEC 05 — Dialog "Vincular padre" en `/kids/[id]`

> **Status:** Implemented
> **Depends on:** SPEC 02 (`specs/02-kids-and-kid-profile.md`) — hereda la ruta `/kids/[id]`, la tarjeta PADRES VINCULADOS (`ParentsCard.tsx`) con su botón inerte "Vincular otro padre", el mock `app/_data/kids.ts` y los tokens de `globals.css`; SPEC 04 (`specs/04-add-kid-dialog.md`) — reusa el patrón de dialog modal (`<dialog>` + `showModal()`, backdrop translúcido, focus trap, cierre por Escape/backdrop, errores en línea) y la decisión de alta en memoria sin persistencia
> **Date:** 2026-10-08
> **Objective:** Implementar el dialog modal de vinculación de padre (`references/pantallas/vincular-padre.dc.html`) que se abre al tocar "Vincular otro padre" en el perfil del niño, con nombre, email y parentesco obligatorios con errores en línea, código de invitación estático y alta del padre como pendiente en memoria.

## Por qué existe esta spec

SPEC 02 dejó el botón "Vincular otro padre" de la tarjeta PADRES VINCULADOS inerte a la espera de esta pantalla. Es el segundo dialog modal de la app y el primero con **pills de selección** (campo PARENTESCO) y con textos dependientes del niño (subtítulo "a Mateo Fernández", banner "Solo verá el feed de Mateo."). La referencia de Penpot es una página suelta centrada sobre fondo crema, pero el producto lo define como un dialog que se abre sobre `/kids/[id]` sin navegar, igual que "Agregar niño" en SPEC 04.

## Scope

**In:**

- El botón "Vincular otro padre" de PADRES VINCULADOS en `/kids/[id]` pasa de inerte a **abrir un dialog modal** (client component): no navega ni cambia la URL.
- Dialog con overlay oscuro translúcido sobre la página y card centrada `max-w-[480px]` con el diseño de la referencia:
  - Cabecera sobre borde inferior con título "Vincular padre" (Fredoka 18px semibold) + subtítulo "a {nombre del niño}" (13px `#A89A8B`), y botón **X** (34×34, radio 10px, fondo `#F0E6D8`, icono `#94887B`) que cierra.
  - Banner informativo azul (fondo `#E3ECFB`, radio 14px, icono info `#4E72C8`, texto 13.5px `#3F5694`): "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primer nombre del niño}."
  - **NOMBRE DEL PADRE/MADRE** (obligatorio): input con placeholder "Ej. Diego Fernández".
  - **EMAIL** (obligatorio): input `type="email"` con placeholder "correo@ejemplo.com".
  - **PARENTESCO** (obligatorio): tres pills `Mamá`, `Papá`, `Tutor/a` (flex-1, radio 999px, extrabold 14px, botones nativos con `aria-pressed`). **Arranca sin ninguna elegida**; la elegida toma el estilo activo de la referencia (borde `#9FB8EC`, fondo `#CCD8F4`, texto `#4E72C8`) y las demás el inactivo (borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`).
  - Caja de **código de invitación**: fondo `#FBF1D6`, borde dashed 1.5px `#E6D08A`, radio 16px, centrada; label "CÓDIGO DE INVITACIÓN", código "7K4P9" (Fredoka 600, 34px, tracking 7px, `#8A7234`) y "Vence en 7 días" (13px `#A88526`). **Estático e igual para todos los niños.**
  - Botón **Enviar invitación**: submit del `<form>`, ancho completo, gradiente `linear-gradient(180deg,#F4977E,#EE8164)`, texto blanco extrabold 15.5px, icono de enviar 19px, sombra coral.
- **Validación al Enviar** (submit del `<form>`): nombre vacío, email vacío o de formato inválido (regex simple) o parentesco sin elegir marcan borde `accent` y mensaje en español bajo el campo. Enviar siempre habilitado. Enter en los campos de texto dispara la misma validación.
- **Envío válido**: Enviar cierra el dialog y agrega el padre a PADRES VINCULADOS **en memoria** como `{ name, initial: primera letra, relation, status: "pending", avatarColor: "blue" }` — se lista como "{parentesco} · invitación enviada" con chip PENDIENTE. Sin persistencia: al refrescar vuelve el `kid.parents` de `kids.ts`.
- **Cierre**: botón X, tecla Escape y click en el backdrop cierran y descartan (reset). `<dialog>` nativo con `showModal()` (focus trap y Escape gratis); foco inicial en NOMBRE DEL PADRE/MADRE; al cerrar, el foco vuelve a "Vincular otro padre"; `overflow: hidden` en `body` mientras está abierto.
- **Estado inicial en cada apertura**: campos vacíos, sin parentesco elegido, sin errores.
- Responsive: card con margen lateral en viewport angosto, sin scroll horizontal desde 360px; en pantallas bajas el cuerpo del dialog scrollea internamente.
- `/kids`, `/`, `/login` y `/activate-account` siguen intactas; "Resumen del día" sigue inerte.

**Out of scope (for future specs):**

- Persistencia: el padre agregado vive solo en el estado de la página; `kids.ts` (mocks constantes) no se muta.
- Envío real de correo; el flujo de activación de SPEC 03 y su mock `invite.ts` no se tocan.
- Lógica de vencimiento o regeneración del código: "7K4P9" y "Vence en 7 días" son texto estático.
- El acceso "Vincular padre" de la home (`index.dc.html`): va en el spec que toque esa pantalla.
- Validación de duplicados (dos "Mamá", o un email ya vinculado al mismo niño).
- Editar o desvincular padres; feed de familia (`familia-feed`) y cuenta de familia (`familia-cuenta`).
- El resto de pantallas pendientes; backend.

## Data model

```ts
// app/_data/kids.ts — único cambio: el tipo suma el valor nuevo
export type ParentRelation = "Mamá" | "Papá" | "Tutor/a";
```

No hay estructuras nuevas persistidas: el estado del formulario vive en `LinkParentDialog.tsx` (`useState`: nombre, email, `relation: ParentRelation | null`, errores por campo) y la lista visible de padres vive en `ParentsCard.tsx` (`useState<ParentLink[]>` inicializado con `kid.parents`). El `ParentLink` nuevo se construye en memoria al enviar y desaparece al refrescar.

## Estructura de archivos

```
app/
  _data/
    kids.ts                          # ParentRelation suma "Tutor/a" (solo el tipo, mocks intactos)
  components/
    kids/
      ParentsCard.tsx                # pasa a client: estado de la lista de padres + trigger "Vincular otro padre" + <LinkParentDialog />
      LinkParentDialog.tsx           # NUEVO (client): <dialog>, overlay, card, banner, campos, pills, código, validación, cierre
```

`/kids/[id]` sigue siendo server component: `ParentsCard` ya recibe `kid` como prop serializable; solo ese subtree pasa a cliente. El resto del perfil (header, alergias, detalles, "Resumen del día") no se toca.

## Implementation plan

Cada paso deja la app funcionando y verificable.

1. **`app/_data/kids.ts`**: `ParentRelation` suma `"Tutor/a"`. Manual: `pnpm exec tsc --noEmit`.
2. **`LinkParentDialog.tsx` (shell estático)**: `<dialog>` con `showModal()/close()` controlado por props `open`/`onClose`/`onSend`, `aria-label "Vincular padre"`, backdrop estilado, card de la referencia (cabecera con X, banner con el primer nombre del niño, labels e inputs, pills con estado de relación, caja de código estática, `<form>` con Enviar `type="submit"`). Manual: `pnpm exec tsc --noEmit` (aún no montado).
3. **Validación y envío**: errores en línea al Enviar (nombre, email, parentesco), reset al cerrar, `onSubmit` arma el `ParentLink` y llama `onSend`. Manual: `tsc`.
4. **Montaje**: `ParentsCard.tsx` pasa a client con `useState` de la lista de padres, el botón "Vincular otro padre" como trigger (abre el dialog) y el alta en memoria (chip PENDIENTE, "invitación enviada"). Manual: `/kids/1` abre y cierra el dialog completo y el padre queda listado.
5. **Pulido de fidelidad y responsive**: comparación lado a lado contra `references/pantallas/vincular-padre.dc.html` en desktop; márgenes en angosto; sin scroll horizontal desde 360px; recorrido con teclado (Tab/Escape/Enter).
6. **Verificación final con reinicio limpio del dev server** (en ese orden, sin saltos):
   1. `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan sin errores.
   2. Matar el dev server corriendo: leer el PID y el puerto de `.next/dev/lock`; si vive, `kill <pid>` y confirmar el puerto libre; si no hay lock, revisar `lsof -ti :3000` y matar solo los de este proyecto.
   3. Re-levantar con `pnpm dev`.
   4. Comprobar en runtime, sin errores ni warnings en la terminal: `/kids/1` con el dialog abierto/cerrado por los 3 caminos, validación de los 3 campos, envío válido listando al padre como PENDIENTE, reopen en estado inicial; `/`, `/kids`, `/login` y `/activate-account` siguen igual.

## Acceptance criteria

- [x] `pnpm exec eslint app` termina sin errores.
- [x] `pnpm exec tsc --noEmit` termina sin errores.
- [x] `pnpm build` completa con éxito.
- [x] Con el dev server relanzado limpio (PID de `.next/dev/lock` matado antes), `/kids/1` con el dialog abierto y cerrado no loguea errores ni warnings en la terminal.
- [x] Click en "Vincular otro padre" abre el dialog sobre `/kids/1` sin cambiar la URL; el fondo queda oscurecido y el scroll de la página bloqueado mientras está abierto.
- [x] En desktop, el dialog replica `references/pantallas/vincular-padre.dc.html`: card 480px crema, título "Vincular padre" + subtítulo "a Mateo Fernández", X arriba a la derecha, banner azul "Le enviaremos un correo… Solo verá el feed de Mateo.", inputs con placeholders "Ej. Diego Fernández" y "correo@ejemplo.com", pills Mamá/Papá/Tutor/a, caja "7K4P9"/"Vence en 7 días" y botón coral "Enviar invitación" con icono.
- [x] En `/kids/2` el subtítulo dice "a Sofía Méndez" y el banner "Solo verá el feed de Sofía." (textos dependientes del niño).
- [x] Las pills arrancan sin ninguna elegida; click en una la marca con el estilo activo y solo una queda activa a la vez.
- [x] El foco entra al dialog en NOMBRE DEL PADRE/MADRE y queda atrapado dentro (Tab no sale); al cerrar, el foco vuelve al botón "Vincular otro padre".
- [x] Enviar con nombre vacío muestra borde y mensaje de error bajo NOMBRE DEL PADRE/MADRE y no cierra el dialog.
- [x] Enviar con email vacío o mal formado (p.ej. "correo@") muestra borde y mensaje bajo EMAIL y no cierra el dialog.
- [x] Enviar sin parentesco elegido muestra mensaje bajo PARENTESCO y no cierra el dialog.
- [x] Enviar con todo válido cierra el dialog; el padre aparece al final de PADRES VINCULADOS con su inicial, "{parentesco} · invitación enviada" y chip PENDIENTE; al refrescar la lista vuelve a la de `kids.ts`.
- [x] La X, Escape y click en el backdrop cierran el dialog.
- [x] Reabrir el dialog tras cerrarlo lo muestra en estado inicial: campos vacíos, sin parentesco, sin errores.
- [x] Sin scroll horizontal desde 360px con el dialog abierto; la card respeta márgenes laterales.
- [x] `/`, `/kids`, `/login` y `/activate-account` siguen funcionando igual.

## Decisions

- **Sí:** trigger en `/kids/[id]` (botón "Vincular otro padre" de PADRES VINCULADOS) y no en la lista `/kids` — el diseño enlaza vincular-padre desde perfil-nino y el modal es por niño ("a Mateo Fernández"). _(decisión del usuario)_
- **Sí:** Enviar valida, cierra y agrega el padre a la lista en memoria con `status: "pending"` — patrón SPEC 04 (chip PENDIENTE, "invitación enviada"), sin persistencia. _(decisión del usuario)_
- **Sí:** código estático "7K4P9" + "Vence en 7 días", igual para todos los niños — mock sin backend; `invite.ts` (flujo de activación, SPEC 03) no se toca. _(decisión del usuario)_
- **Sí:** PARENTESCO arranca sin selección y es obligatorio con error en línea — el usuario debe elegir explícito (distinto de SALA en SPEC 04, que arrancaba en Soles por defecto). _(decisión del usuario)_
- **Sí:** validación nombre no vacío + email con regex simple; Enviar siempre habilitado. _(decisión del usuario)_
- **Sí:** extender `ParentRelation` con `"Tutor/a"` en `kids.ts` — es la fuente del tipo; los mocks existentes no lo usan pero quedan habilitados.
- **Sí:** el padre nuevo se construye con `initial` = primera letra del nombre y `avatarColor: "blue"` — sigue el precedente de los padres pending de los mocks (Diego Fernández, Martín Romero).
- **Sí:** cabecera con botón X (como la referencia) en vez de Cancelar/título/Guardar de SPEC 04 — la acción principal es el botón coral "Enviar invitación".
- **Sí:** `<dialog>` nativo con `showModal()`, cierre por X/Escape/backdrop, focus trap y `overflow: hidden` en `body` — patrón SPEC 04 tal cual.
- **Sí:** tokens existentes (`auth-canvas`, `auth-line`, `line`, `accent`, `ink-*`); colores puntuales de la referencia (banner azul, pills, caja de código) inline como en SPEC 02/03/04. `globals.css` queda intacto.
- **No:** envío real de correo, backend ni mutar `kids.ts`.
- **No:** lógica de vencimiento/regeneración del código.
- **No:** validar duplicados (dos "Mamá", email repetido).
- **No:** el acceso "Vincular padre" de la home (va en el spec de esa pantalla si llega).

## Risks

| Riesgo                                                             | Mitigación                                                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| La referencia no define backdrop ni estados de error               | Se diseñan con la paleta existente (ink translúcido, `accent`), igual que SPEC 04                           |
| PARENTESCO sin selección inicial puede parecer opcional            | Mensaje de error en línea al Enviar; las pills se ven interactivas (cursor, hover)                          |
| Sumar `"Tutor/a"` a `ParentRelation` impacta otros usos del tipo   | Solo agrega un valor permitido; `ParentsCard` muestra `relation` tal cual; verificar con `tsc` en el paso 1 |
| Pantallas bajas: el dialog puede superar la altura del viewport    | Cuerpo del dialog con scroll interno (patrón SPEC 04)                                                       |
| Click en backdrop puede cerrar al arrastrar una selección de texto | Solo cerrar cuando `event.target` es el propio `<dialog>`                                                   |

## What is **not** in this spec

- Persistir el padre: `kids.ts`, backend, envío real de correo.
- Lógica de vencimiento del código de invitación (texto estático).
- El acceso "Vincular padre" de la home.
- Editar o desvincular padres; feed de familia y cuenta de familia.
- Las demás pantallas pendientes (cada una va en su propia spec).
