# SPEC 04 — Dialog "Agregar niño" en `/kids`

> **Status:** Approved
> **Depends on:** SPEC 02 (`specs/02-kids-and-kid-profile.md`) — hereda la ruta `/kids` y su botón "Agregar niño", el patrón de mocks por dominio en `app/_data/`, los tokens de `globals.css` y la paleta de chips de `KidCard`; reutiliza los tokens `auth-canvas`/`auth-line` de SPEC 03, cuyos valores coinciden con esta referencia
> **Date:** 2026-10-07
> **Objective:** Implementar el dialog modal de alta de niño (`references/pantallas/agregar-nino.dc.html`) que se abre al tocar "Agregar niño" en `/kids`, con nombre completo, fecha de nacimiento con máscara dd/mm/aaaa y sala como obligatorios, alergias en chips y notas médicas como opcionales, validación con errores en línea y cierre sin persistencia.

## Por qué existe esta spec

SPEC 02 dejó el botón "Agregar niño" inerte a la espera de esta pantalla. Es el primer **dialog modal** de la app (hasta ahora todo eran rutas), el primer formulario con **validación y errores en línea**, y el primer input con **máscara**. La referencia de Penpot es una página suelta centrada en un fondo crema, pero el producto lo define como un dialog que se abre sobre `/kids` sin navegar.

## Scope

**In:**

- El botón "Agregar niño" de `/kids` pasa de inerte a **abrir un dialog modal** (client component): no navega ni cambia la URL.
- Dialog con overlay oscuro translúcido sobre la página y card centrada `max-w-[520px]` con el diseño de la referencia:
  - Cabecera con **Cancelar** (`ink-faint`), título "Agregar niño" (Fredoka 18px) y **Guardar** (`accent`), sobre borde inferior.
  - Labels 12px extrabold con tracking `.7px` en `#94887B` + inputs blancos radio 14px borde 1.5px `auth-line`, placeholder `#B6A99B`.
- **NOMBRE COMPLETO** (obligatorio): input con placeholder "Ej. Martina López".
- **FECHA DE NACIMIENTO** (obligatorio): máscara dd/mm/aaaa — solo dígitos, `/` autoinsertada al completar día y mes, largo máximo 10, borrado sensato (Backspace salta la barra en vez de dejarla colgando), `inputMode="numeric"`. Al tipear se rechazan los dígitos que dejarían el campo fuera de rango: día > 31 (p.ej. "32") o mes > 12 (p.ej. "13"). Al guardar valida fecha real del calendario (p.ej. 31/02/2025 rechazada) y no futura (mañana en adelante rechazada; hoy válida).
- **SALA** (obligatorio): combobox custom (`role="combobox"` + `role="listbox"`) con trigger estilado como la referencia (valor + chevron); al abrir despliega la lista **justo debajo del trigger, dentro del dialog y con el ancho del campo** (si no cabe debajo, se abre hacia arriba). Opciones **Soles, Lunas, Estrellas** desde `app/_data/rooms.ts`; arranca en **Soles**, sin opción vacía. Teclado: Enter/Space/flechas abren, flechas navegan, Enter/Space seleccionan, Escape cierra (sin cerrar el dialog), Tab cierra y avanza.
- **ALERGIAS (ETIQUETAS)** (opcional): input de chips — escribir y pulsar **Enter** o **coma** crea la etiqueta, cada chip con **X** para quitarla; Enter en este input no dispara Guardar. Chips con la paleta del chip de alergia de la grilla (`#FBD8CC`/`#D9684A`).
- **NOTAS MÉDICAS** (opcional): textarea `min-height 90px`, placeholder "Indicaciones, medicación, contactos…", `resize: vertical`.
- **Validación al Guardar** (submit del `<form>`): los obligatorios inválidos (nombre vacío; fecha incompleta, inexistente o futura) marcan borde `accent` y mensaje de error en español bajo el campo. Guardar siempre habilitado. Con todo válido, Guardar **cierra el dialog** sin tocar la grilla ni los mocks. Enter en los campos de texto dispara la misma validación.
- **Cierre**: botón Cancelar, tecla Escape y click en el backdrop cierran y descartan. `<dialog>` nativo con `showModal()` (focus trap y Escape gratis); click del backdrop detectado sobre el propio dialog; `overflow: hidden` en `body` mientras está abierto; foco inicial en NOMBRE COMPLETO; al cerrar, el foco vuelve al botón "Agregar niño".
- **Estado inicial en cada apertura**: campos vacíos, sala Soles, sin chips, sin errores.
- Responsive: card con margen lateral en viewport angosto, sin scroll horizontal desde 360px; en pantallas bajas el cuerpo del dialog scrollea internamente.
- `/`, `/kids/[id]`, `/login` y `/activate-account` siguen intactas.

**Out of scope (for future specs):**

- Persistencia y mutaciones: Guardar no agrega el niño a la grilla ni modifica `app/_data/kids.ts` (mocks constantes, sin backend).
- La grilla de `/kids` no se agrupa por sala ni muestra Lunas/Estrellas: sigue literal "SALA SOLES · 8 niños" como su referencia.
- Date picker con calendario: la fecha se ingresa solo con máscara de texto.
- Vincular padres, editar niño, resumen del día (siguen inertes).
- Validación de nombre más allá de no-vacío (sin largo mínimo ni formato).
- El resto de pantallas pendientes; autenticación; backend.

## Data model

```ts
// app/_data/rooms.ts
export const rooms: readonly string[] = ["Soles", "Lunas", "Estrellas"];
```

No hay estructuras nuevas persistidas: el estado del formulario vive en `AddKidDialog.tsx` (`useState`: nombre, fecha enmascarada, sala, `allergies: string[]`, notas, errores por campo). El tipo `Kid` y `kids.ts` no se tocan.

## Estructura de archivos

```
app/
  globals.css                       # sin cambios (solo tokens existentes)
  _data/
    rooms.ts                        # NUEVO: rooms = ["Soles","Lunas","Estrellas"]
  components/
    kids/
      AddKidButton.tsx              # NUEVO (client): botón coral "Agregar niño" + useState + <AddKidDialog />
      AddKidDialog.tsx              # NUEVO (client): <dialog>, overlay, card, campos, máscara, chips, validación, cierre
  (daycare)/
    kids/
      page.tsx                      # el <button> inerte del header se reemplaza por <AddKidButton />
```

`/kids` sigue siendo server component: solo el subtree del botón/dialog pasa a cliente. Los elementos inertes de otras pantallas no se tocan.

## Implementation plan

Cada paso deja la app funcionando y verificable.

1. **`app/_data/rooms.ts`**: `rooms` con las 3 salas. Manual: `pnpm exec tsc --noEmit`.
2. **`AddKidDialog.tsx` (shell estático)**: `<dialog>` con `showModal()/close()` controlado por props `open`/`onClose`, `aria-label "Agregar niño"`, backdrop estilado, card de la referencia (cabecera Cancelar/título/Guardar, labels, inputs, `<select>` desde `rooms` con chevron, textarea), `<form>` con Guardar `type="submit"` y Cancelar `type="button"`. Manual: `pnpm exec tsc --noEmit` (aún no está montado).
3. **Máscara de fecha y chips de alergias**: interacción de los dos campos especiales según Scope. Manual: `tsc`.
4. **Validación y cierre**: errores en línea al Guardar, cierre por Cancelar/Escape/backdrop, foco inicial en nombre, foco de vuelta al trigger, `overflow: hidden` en `body` mientras el dialog está abierto. Manual: `tsc`.
5. **Montaje**: `AddKidButton.tsx` (botón idéntico al actual + estado) reemplaza el botón inerte en `app/(daycare)/kids/page.tsx`. Manual: `/kids` abre y cierra el dialog completo.
6. **Pulido de fidelidad y responsive**: comparación lado a lado contra `references/pantallas/agregar-nino.dc.html` en desktop; márgenes en angosto; sin scroll horizontal desde 360px; recorrido completo con teclado (Tab/Escape).
7. **Verificación final con reinicio limpio del dev server** (en ese orden, sin saltos):
   1. `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan sin errores.
   2. Matar el dev server corriendo: leer el PID y el puerto de `.next/dev/lock`; si vive, `kill <pid>` y confirmar el puerto libre; si no hay lock, revisar `lsof -ti :3000` y matar solo los de este proyecto.
   3. Re-levantar con `pnpm dev`.
   4. Comprobar en runtime, sin errores ni warnings en la terminal: `/kids` con el dialog abierto/cerrado por los 3 caminos, validación, máscara, chips, grilla intacta; `/`, `/kids/1`, `/login` y `/activate-account` siguen igual.

## Acceptance criteria

- [ ] `pnpm exec eslint app` termina sin errores.
- [ ] `pnpm exec tsc --noEmit` termina sin errores.
- [ ] `pnpm build` completa con éxito.
- [ ] Con el dev server relanzado limpio (PID de `.next/dev/lock` matado antes), `/kids` con el dialog abierto y cerrado no loguea errores ni warnings en la terminal.
- [ ] Click en "Agregar niño" abre el dialog sobre `/kids` sin cambiar la URL; el fondo queda oscurecido y el scroll de la página bloqueado mientras está abierto.
- [ ] En desktop, el dialog replica `references/pantallas/agregar-nino.dc.html`: card 520px crema, cabecera Cancelar/"Agregar niño"/Guardar, labels en caps con tracking, inputs blancos radio 14px y placeholders "Ej. Martina López", "dd/mm/aaaa", "Ej. Maní, Lactosa", "Indicaciones, medicación, contactos…".
- [ ] El foco entra al dialog en NOMBRE COMPLETO y queda atrapado dentro (Tab no sale); al cerrar, el foco vuelve al botón "Agregar niño".
- [ ] El selector de sala muestra exactamente Soles, Lunas y Estrellas, arranca en Soles y su trigger se ve como la referencia (chevron).
- [ ] Al tipear no se puede formar un día > 31 ni un mes > 12: esos dígitos se ignoran al escribir (p.ej. "32" en día queda "3", "13" en mes queda "1").
- [ ] La lista del selector de sala se abre justo debajo del trigger, dentro del dialog y con el ancho del campo SALA; si no cabe debajo se abre hacia arriba. Escape cierra la lista sin cerrar el dialog.
- [ ] Tipear "31082022" en fecha produce "31/08/2022"; solo se aceptan dígitos, sin pasar de 10 caracteres; Backspace no deja barras colgando.
- [ ] Guardar con nombre vacío muestra borde y mensaje de error bajo NOMBRE COMPLETO y no cierra el dialog.
- [ ] Guardar con fecha incompleta, inexistente (31/02/2025) o futura muestra borde y mensaje bajo FECHA DE NACIMIENTO y no cierra el dialog.
- [ ] Guardar con alergias y notas vacías (opcionales) cierra sin errores.
- [ ] Guardar con todo válido cierra el dialog; la grilla sigue mostrando exactamente los 8 niños de siempre.
- [ ] Cancelar, Escape y click en el backdrop cierran el dialog.
- [ ] Reabrir el dialog tras cerrarlo lo muestra en estado inicial: campos vacíos, sala Soles, sin chips, sin errores.
- [ ] Las alergias funcionan como chips: "Maní" + Enter crea el chip, la coma también, la X lo quita; Enter con el input vacío no cierra ni guarda.
- [ ] Sin scroll horizontal desde 360px con el dialog abierto; la card respeta márgenes laterales.
- [ ] `/`, `/kids/[id]`, `/login` y `/activate-account` siguen funcionando igual.

## Decisions

- **Sí:** dialog modal sobre `/kids` en vez de una ruta aparte — la referencia de Penpot es una página suelta, pero el pedido lo define como dialog que salta al clic. _(decisión del usuario, explícita en el pedido)_
- **Sí:** Guardar solo valida y cierra, sin agregar el niño a la grilla — mocks constantes, sin backend. _(decisión del usuario)_
- **Sí:** validación con borde rojo + mensaje bajo el campo, Guardar siempre habilitado. _(decisión del usuario)_
- **Sí:** máscara dd/mm/aaaa + validación de fecha real y no futura al guardar. _(decisión del usuario)_
- **Sí:** salas hardcode Soles, Lunas, Estrellas. _(decisión del usuario)_
- **Sí:** chips interactivas para alergias (Enter/coma agregan, X quita). _(decisión del usuario)_
- **Sí:** combobox custom para SALA (`role="combobox"` + `role="listbox"`, lista justo debajo del trigger dentro del dialog, con flip si no cabe) en vez de `<select>` nativo. _(cambio de decisión del usuario: el popup nativo se abre fuera del modal y con un tamaño que no corresponde al campo)_
- **Sí:** la máscara rechaza al tipear los dígitos que dejarían día > 31 o mes > 12; la validación de calendario y de fecha futura sigue siendo al Guardar. _(cambio de decisión del usuario)_
- **Sí:** cierre por Cancelar + Escape + backdrop, con focus trap. _(decisión del usuario)_
- **Sí:** `app/_data/rooms.ts` como módulo propio, siguiendo el patrón de mocks por dominio (`kids.ts`, `invite.ts`). _(decisión del usuario)_
- **Sí:** sala "obligatoria" satisfecha por default — el select arranca en Soles como en la referencia y no ofrece opción vacía, así que no puede fallar validación.
- **Sí:** `<dialog>` nativo con `showModal()` — focus trap y Escape salen gratis y el foco vuelve solo al trigger; el click del backdrop se detecta sobre el propio dialog (`::backdrop` no recibe eventos).
- **Sí:** chips con la paleta del chip de alergia de `KidCard` (`#FBD8CC`/`#D9684A`) — la referencia no dibuja chips (input plano); se reusa la paleta existente por coherencia.
- **Sí:** reutilizar `auth-canvas`/`auth-line` (valores idénticos `#FBF4EC`/`#EADFD0`) en vez de crear tokens nuevos; resto de colores puntuales inline, patrón SPEC 02/03. `globals.css` queda intacto.
- **Sí:** errores en `accent` (`#D9583C`) — el proyecto no tiene token de error; el coral es el color de alerta/acción de la paleta.
- **No:** persistencia, backend ni mutar `kids.ts`/la grilla.
- **No:** date picker con calendario.
- **No:** agrupar `/kids` por sala ni mostrar las salas nuevas en la grilla o el divisor.
- **No:** validación de nombre más allá de no-vacío.

## Risks

| Riesgo                                                                                           | Mitigación                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| La referencia no define backdrop, estados de error ni chips (sus inputs son planos)              | Se diseñan con la paleta existente (ink translúcido, `accent`, chip de `KidCard`); la fidelidad "idéntica" solo se exige en el estado estático |
| La máscara puede dejar barras colgando al borrar                                                 | Backspace salta la barra; probar tipeo y borrado en runtime en el paso 6                                                                       |
| Estilar `::backdrop` con Tailwind (inline styles no alcanzan pseudo-elementos)                   | Variante arbitraria `[&::backdrop]:…`; verificar contra la documentación de Tailwind v4 durante el paso 2                                      |
| El click-en-backdrop vía click en el `<dialog>` puede cerrar al arrastrar una selección de texto | Solo cerrar cuando `event.target` es el propio `<dialog>`, no sus hijos                                                                        |
| `showModal()` no bloquea el scroll del fondo en todos los navegadores                            | `overflow: hidden` en `body` mientras el dialog está abierto (effect con cleanup)                                                              |
| La validación "no futura" depende del reloj del cliente                                          | Aceptable en un mock sin backend; comparar solo la parte de fecha, sin horas                                                                   |
| El header de `/kids` pierde el botón como markup server                                          | Solo el subtree del botón pasa a cliente (`AddKidButton`); el resto de la página sigue en el server                                            |

## What is **not** in this spec

- Agregar el niño a la grilla o persistirlo de cualquier forma.
- Agrupar `/kids` por sala o reflejar las salas nuevas en la grilla.
- Date picker con calendario.
- Vincular padres, editar niño y resumen del día.
- Las demás pantallas pendientes (cada una va en su propia spec).
