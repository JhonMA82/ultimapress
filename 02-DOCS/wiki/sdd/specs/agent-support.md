---
type: spec
title: Native agent support — any MCP client, any coding agent
description: UltimaPress 1.1.5 ships one portable instruction file, skills discovered by OMP/OpenCode/Pi, a client picker that registers native MCP setups, and a Claude-free repair and delivery flow.
tags: [sdd, spec, agents, mcp]
timestamp: 2026-11-21T04:30:00Z
topic: sdd
status: approved-pending
slug: agent-support
branch: main
---

# Spec — native agent support

Owner: the site owner who downloads their site's code or connects an AI client.
Reference approved by the person: the plan `soporte-nativo-asistentes-plan.md` (accepted
2026-11-21), whose observable contract and acceptance evidence this spec turns into checks.

## Problem & why

UltimaPress 1.1.4 documenta dos recorridos, ambos atados a Claude: `CLAUDE.md` es el único archivo
de instrucciones que un agente lee, la skill `payload` solo existe en `.claude/skills/`, y la
página *Site code*, los prompts de reparación y los mensajes del supervisor dicen "Claude" incluso
cuando quien edita es otro agente. `AGENTS.md` solo contiene el bloque generado por Next, y su
contenido se regenera, así que un agente que prioriza `AGENTS.md` (OpenCode, OMP) no aprende nada
del producto. El servidor MCP ya es común —crea una clave por usuario y acepta `?key=` o Bearer—
pero el dashboard solo ofrece la URL con la clave y un comando de Claude Code; no hay una vía
nativa para Oh My Pi, OpenCode V2 ni Pi Agent, ni una alternativa genérica por Streamable HTTP.

## Goals

1. Un solo lugar de instrucciones (`AGENTS.md`) que cualquier agente lea, con la guía de Payload
   descubrible por OMP, OpenCode V2, Pi y Claude sin duplicar reglas.
2. Un selector de cliente en el dashboard que entregue la configuración nativa correcta —o la
   alternativa genérica por Streamable HTTP— reutilizando la conexión y las claves existentes.
3. Un recorrido de edición, entrega y reparación que no exija Claude, sin relajar permisos,
   confirmación con contraseña ni las guardas de seguridad/build/rollback.
4. Cero credenciales nuevas en plantillas copiables, prompts, logs, capturas o ZIP.

## Users & context

- **Site owner (admin):** descarga el ZIP, elige agente, crea y revoca conexiones, confirma
  versiones y contraseñas. Es quien instala la deploy key y quien decide qué queda live.
- **Editor / Author:** usa una conexión MCP creada a su nombre; su rol limita lo que el cliente
  puede leer y escribir. No ve *Site code* si no es admin.
- **Agente de código:** OMP, OpenCode V2, Pi Agent, Claude Code u otro que abra la carpeta y lea
  Markdown; puede o no tener cargador de skills y puede o no tener MCP remoto.
- **Cliente MCP:** app con Streamable HTTP (OMP, OpenCode V2, Pi, Claude, ChatGPT, Inspector) o
  cualquier cliente que acepte una URL y una cabecera Bearer.
- **Contexto de instalación:** sitio Docker con HTTPS y dominio propio; la prueba local usa
  `127.0.0.1:18080` y HTTP solo para loopback, nunca como instrucción de producción.

## What the user can do

- **Código:** descargar el ZIP del sitio, descomprimirlo y abrirlo con Oh My Pi, OpenCode V2, Pi
  Agent, Claude Code o cualquier editor/agente que lea Markdown. El agente encuentra `AGENTS.md`,
  la guía de Payload en `.agents/skills/payload/guide.md` y sus referencias, sin depender de que el
  cliente tenga cargador de skills.
- **Código:** pedir una funcionalidad con el prompt inicial `Read AGENTS.md first. …`, ejecutar la
  línea de alta de la deploy key una vez en la terminal de la carpeta, y usar `pnpm ship` en las
  siguientes entregas. El dueño confirma en *Site code* con su contraseña.
- **Contenido:** en *Build with AI → Content & design*, elegir su cliente en un selector (`Any
  MCP-compatible client`, `Claude`, `ChatGPT`, `Claude Code`, `Oh My Pi`, `OpenCode V2`, `Pi
  Agent`), crear una conexión propia y copiar la configuración nativa o la dirección limpia.
- **Contenido:** registrar la conexión en el cliente y crear un borrador según su rol; revocarla
  desde *Manage connections*.
- **Reparación:** ante un conflicto o un fallo de seguridad, descargar el código actualizado y
  copiar `Copy repair prompt` para llevarlo al mismo agente, sea cual sea.

## What result they get

- El ZIP (normal o de conflicto) contiene `AGENTS.md`, `CLAUDE.md`, las dos entradas
  `SKILL.md` idénticas, `guide.md` y `reference/ACCESS-CONTROL.md`, y no contiene
  `.ultimapress-deploy.json`.
- El agente cita la regla de migraciones y localiza `ACCESS-CONTROL.md` usando la skill `payload`,
  tanto con `.claude` presente como en una copia sin `.claude` ni `CLAUDE.md`.
- La configuración copiada para OMP, OpenCode V2 y Pi es la de la tabla del plan, con la clave
  referenciada como variable de entorno y nunca dentro del JSON, del prompt o del ZIP.
- El dashboard no emite una segunda clave al cambiar de cliente después de conectar.
- Con una cuenta Author, `writePost` devuelve `Saved as a draft` para `Agent support smoke - Pi`;
  `writePage` no crea ninguna página. Con la deploy key, *Site code* muestra `An update is
  waiting` y la versión no cambia hasta la confirmación con contraseña.
- Revocar la conexión impide nuevas llamadas autorizadas.

## What it must respect

- `02-DOCS/wiki/sdd/constitution.md` v1.0.0: permisos de Payload, claves separadas (contenido vs
  envío de código), confirmación del administrador con contraseña, guardas de seguridad/build y
  rollback, autoría humana de los commits.
- El contrato existente `{ url, claudeCode, https }` y las rutas `/api/claude-connect` y
  `/api/mcp`; `src/plugins/index.ts` no cambia su lógica de credenciales.
- El hash `#build-with-claude` al que enlaza la Spine, y las rutas/controles de acceso actuales.
- Los empaquetadores no se tocan para admitir las skills: archivos reales, nunca symlinks; el
  supervisor sigue eliminando symlinks al importar.
- Los campos persistidos `forClaude`/`needsClaude` no se renombran ni migran; el nombre de wire no
  se usa para describir la capacidad del usuario.
- Ninguna guía nueva guarda claves ni archivos MCP de usuario dentro del proyecto; `.gitignore` no
  controla los empaquetadores.
- Los tres flujos legados (Claude, ChatGPT, Claude Code) conservan su aviso HTTPS actual.

## Behaviour

### Code context and discovery

1. `AGENTS.md` conserva el bloque `<!-- BEGIN:nextjs-agent-rules --> … <!-- END:nextjs-agent-rules -->`
   y debajo lleva la guía de producto de `CLAUDE.md`, con encabezado `UltimaPress: project
   instructions` y referencias neutrales.
2. `CLAUDE.md` queda con su encabezado y la importación literal `@AGENTS.md`; no duplica reglas.
3. La guía de Payload vive en `.agents/skills/payload/guide.md`; las referencias completas en
   `.agents/skills/payload/reference/`. `.agents/skills/payload/SKILL.md` y
   `.claude/skills/payload/SKILL.md` son archivos reales e idénticos, con `name: payload`, la
   descripción YAML original y un cuerpo que manda leer la guía desde la raíz.
4. No se añade `opencode.json(c)`, `.omp/mcp.json`, `.pi/mcp.json` ni extensiones ejecutables.

### Build a feature / Site code copy

5. `BUILD_FEATURE_STARTER = 'Read AGENTS.md first. Then add to my UltimaPress site: '` y un
   componente compartido `CodingAgentSetup` muestran: abrir la carpeta en cualquier agente; en la
   terminal de esa carpeta, `claude`, `omp`, `opencode` (V2) o `pi`; para Pi, revisar y aceptar la
   confianza del proyecto; para otros clientes, pedir que se lean `AGENTS.md` y la guía.
6. Los tres puntos (dashboard, *Build a feature*, *Site code*) dicen que `pnpm ship` **envía** y el
   dueño **confirma** en *Site code*; sin "Claude" como sujeto obligatorio.
7. La deploy key se explica como una línea que se ejecuta una vez en la terminal de la carpeta; la
   clave no se pega en la conversación. Después basta `pnpm ship`.

### Repair

8. `SiteCodeClient` muestra `This update needs attention` en conflictos, conserva `Download the
   updated code`, y ofrece `Copy repair prompt` para conflicto y seguridad cuando hay texto.
9. `UpdateButton` muestra `Update needs attention: open Site code`.
10. `docker/upgrade.mjs:conflictsForClaude` empieza con `Read AGENTS.md first.`, conserva la lista
    de archivos, los marcadores, la validación y el envío; si `AGENTS.md` está en conflicto, pide
    resolver primero sus marcadores conservando el bloque Next y las reglas del sitio.
11. `src/components/admin/Security/Report.client.tsx` usa `Copy repair prompt` y `Copy the repair
    prompt:` como fallback; los textos de diagnóstico son neutrales, igual que los de
    `SiteHealth`. `docker/security-check.mjs:forClaude` conserva su contenido y contrato.
12. `src/endpoints/siteCode.ts` dirige a `pnpm ship` cuando el archivo es demasiado grande y usa
    `Sent from your computer`; `src/mcp/tools.ts:ultimaPressInstructions` señala *Site code* y
    cualquier agente de código sin cambiar el API de herramientas.

### MCP client picker

13. `src/components/BeforeDashboard/BuildWithClaude.tsx` pasa a `BuildWithAI` (sin prop `repoUrl`),
    conserva clases, anchor y pestañas. En *Content & design* añade un `<select>` etiquetado `AI
    client` con las siete opciones (genérica por defecto).
14. `Connect AI Client` hace el mismo POST autenticado; cambiar de cliente después no emite otra
    clave. Error con `role="alert"`; *Manage connections* sigue visible tras conectar.
15. `src/components/BeforeDashboard/nativeMcpSetup.ts` (sin dependencias) expone:
    - `parseMcpConnection(url)`: exige `new URL`, `key` no vacío, sin `username`/`password`, ruta
      terminada en `/api/mcp`; HTTPS siempre, HTTP solo para `localhost`, `127.0.0.1` o `[::1]`.
      Devuelve `{ ok: true, endpoint, key }` con `search` y `hash` eliminados, o
      `{ ok: false, reason: 'invalid' | 'https-required' }`.
    - `nativeMcpConfig(client, endpoint)`: JSON con `JSON.stringify(value, null, 2)`:
      - OMP: `mcpServers.ultimapress = { type: 'http', url, headers: { Authorization: 'Bearer
        ${ULTIMAPRESS_MCP_KEY}' } }`.
      - OpenCode V2: `mcp.servers.ultimapress = { type: 'remote', url, oauth: false, headers: {
        Authorization: 'Bearer {env:ULTIMAPRESS_MCP_KEY}' } }`.
      - Pi: `mcpServers.ultimapress = { url, headers: { Authorization: 'Bearer
        ${ULTIMAPRESS_MCP_KEY}' } }`.
16. La UI indica el archivo de usuario, que se fusione solo la entrada `ultimapress`, que un nombre
    repetido para otro sitio exige nombre y variable distintos, y que `ULTIMAPRESS_MCP_KEY` exista
    en el proceso del cliente antes de iniciarlo. Ofrece el comando Bash
    `read -rsp 'UltimaPress MCP key: ' ULTIMAPRESS_MCP_KEY; export ULTIMAPRESS_MCP_KEY; printf '\n'`
    y lanzar desde esa terminal.
17. `Any MCP-compatible client`: `Streamable HTTP`, `Copy MCP URL` (sin clave) y `Authorization:
    Bearer <connection key>`. La dirección con clave queda en un `<details>` con aviso de
    contraseña.
18. Para los cuatro clientes nuevos, `Copy connection key` separado; la clave no aparece por
    defecto en texto ni en `title`, ni en consola/telemetría. `Copied` solo tras éxito real de
    clipboard; si API y fallback fallan, aparece un campo de solo lectura tras el clic.

## Acceptance criteria

- **AC1** — Una copia limpia con `AGENTS.md` + `.agents` (sin `.claude` ni `CLAUDE.md`) permite a
  OMP, OpenCode V2 y Pi citar la regla de migraciones y localizar `reference/ACCESS-CONTROL.md`
  usando `payload`.
- **AC2** — `unzip -l "$SITE_ZIP"` muestra `AGENTS.md`, `CLAUDE.md`, `.agents/skills/payload/SKILL.md`,
  `.claude/skills/payload/SKILL.md`, `.agents/skills/payload/guide.md` y
  `.agents/skills/payload/reference/ACCESS-CONTROL.md`; no muestra `.ultimapress-deploy.json`.
- **AC3** — En el dashboard, cambiar de cliente tras conectar no produce un segundo POST a
  `/api/claude-connect`; recargar vuelve a `Any MCP-compatible client` y no persiste clave ni
  selección.
- **AC4** — `nativeMcpConfig` para `https://site.example/api/mcp?key=up_fixture` produce los tres
  JSON con la jerarquía de la tabla, `oauth: false` solo en OpenCode, la variable literal y sin
  `up_fixture` ni `?key=`.
- **AC5** — `parseMcpConnection` acepta HTTPS y `http://127.0.0.1:18080/...`; devuelve `invalid`
  para URL mal formada, sin clave o con `user:pass@`; devuelve `https-required` para HTTP remoto.
  La UI muestra exactamente `The connection could not be read. Reload the dashboard and create a
  new connection.` o `Use HTTPS to connect an AI client to a remote site.`
- **AC6** — La vista genérica muestra `Streamable HTTP`, una URL sin clave y la indicación
  `Authorization: Bearer <connection key>`; la URL con clave solo dentro de `<details>`.
- **AC7** — `Copied` no aparece si el portapapeles falla; si API y fallback fallan, el campo
  manual aparece solo tras el clic.
- **AC8** — Los tres puntos de código usan `Read AGENTS.md first.`, nombran `claude`, `omp`,
  `opencode` (V2) y `pi`, y explican que `pnpm ship` envía y el dueño confirma.
- **AC9** — En un conflicto de prueba, *Site code* muestra `This update needs attention`, el ZIP
  descargable y `Copy repair prompt` con `Read AGENTS.md first.`, el archivo, los marcadores y los
  comandos de validación.
- **AC10** — Con la deploy key, `pnpm ship` deja `An update is waiting`; `/agent-support-smoke.txt`
  responde 404 hasta confirmar con contraseña y 200 después.
- **AC11** — `writePost` con Author devuelve `Saved as a draft`; `writePage` falla sin crear
  página; revocar la conexión bloquea una llamada nueva; `claudeCode` con clave nueva sigue
  funcionando.
- **AC12** — MCP Inspector con Streamable HTTP, URL limpia y `Authorization: Bearer` lista las
  herramientas del sitio.
- **AC13** — `pnpm exec vitest run --config ./vitest.config.mts
  tests/int/native-mcp-setup.int.spec.ts`, `pnpm exec tsc --noEmit` y `pnpm run lint` pasan.
- **AC14** — Ningún texto de la UI o de los prompts de reparación exige Claude para completar el
  recorrido; los nombres legados `forClaude`/`needsClaude` permanecen solo en el wire.

## Points to clarify

- **suposición tomada** — `nativeMcpConfig` devuelve el esqueleto completo del archivo
  (`mcpServers` o `mcp.servers`), no solo la entrada, para que el JSON copiado sea utilizable; la
  UI sigue diciendo que se fusione solo `ultimapress`. Base: la columna "Archivo/contenedor" de la
  tabla del plan.
- **suposición tomada** — Las dos entradas `SKILL.md` serán idénticas byte a byte y `.claude`
  apuntará a la guía bajo `.agents`; la resolución de enlaces es relativa a `guide.md`. Base:
  plan §1.2.
- **suposición tomada** — El selector no se persiste; el valor por defecto tras recargar es
  `Any MCP-compatible client`. Base: plan §3.1.
- **decisión diferida** — Los binarios concretos de OMP/OpenCode/Pi y el modelo de prueba se
  eligen en la verificación; si el entorno no permite una llamada real, se registra como pendiente
  y no se declara compatibilidad validada. Base: plan, supuestos y contingencias.
- **decisión diferida** — El README conserva su narrativa de marketing; solo se alinean las
  etiquetas de UI que cambian (`Copy repair prompt`, `An update is waiting`, `Put the update
  live`) para que no documenten botones inexistentes.
- **área no formulable** — La certificación de "cualquier agente" queda por capacidad, no por
  lista cerrada; no se promete soporte de clientes sin Streamable HTTP para contenido.

## How it proves it

1. **Contratos de configuración:** `tests/int/native-mcp-setup.int.spec.ts` con caso positivo,
   negativos y mutación que incluiría la clave cruda o `mcp.<name>` en V2 (debe fallar).
   Comandos: `pnpm exec vitest run --config ./vitest.config.mts
   tests/int/native-mcp-setup.int.spec.ts`, `pnpm exec tsc --noEmit`, `pnpm run lint`.
2. **Producto real y ZIP:** copia limpia, `docker compose -p up-agents-smoke … up -d --build
   --wait` en `127.0.0.1:18080`; navegador real, admin y Author de prueba; teclado en el selector;
   `unzip -l` sobre el ZIP oficial; descompresión sin `.git`; los cuatro agentes citan la regla y
   encuentran `ACCESS-CONTROL.md`; repetición sin `.claude`/`CLAUDE.md`.
3. **MCP extremo a extremo:** versiones registradas (`omp --version`, `opencode --version`,
   `pi --version`), perfiles desechables, configuración copiada, `writePost` real por cliente,
   `writePage` denegado, revocación, alias y `claudeCode`, MCP Inspector. Estados y capturas
   redactadas; ninguna clave impresa.
4. **Entrega y recuperación:** marcador `agent-support-smoke.txt`, deploy key, `An update is
   waiting`, 404→200 tras confirmar; script temporal con `mergeSites`/`conflictsForClaude` sobre
   `base/ours/theirs`, conflicto, skills presentes y ZIP con `zip -r -q`; `Copy repair prompt` en
   el navegador.
5. **Evidencia duradera:** `02-DOCS/wiki/sdd/verifications/agent-support-2026-11-21.md` con
   comandos, salidas y capturas redactadas; `progress/agent-support.md` con el ledger.

## Clarifications

**2026-11-21 — pass run under the approved plan (autopilot).** No blocking gap found: every
question below either had an answer in the constitution/plan or changes only wording, so it is
recorded as an assumption and mirrored to the decision queue as `review-after`.

- *¿La configuración nativa copia solo la entrada o el archivo completo?* → archivo completo
  (`mcpServers` / `mcp.servers`) con una única entrada `ultimapress`; copiar solo la entrada deja
  al dueño que adivine el contenedor. Basis: tabla del plan, columnas 2–3.
- *¿Basta con que `.agents` exista para que OMP/OpenCode/Pi lo vean en el ZIP?* → sí, el plan
  verificó que ZIP/TGZ conservan directorios ocultos y el supervisor solo elimina symlinks; no se
  toca el empaquetado. Basis: diagnóstico del plan.
- *¿Qué pasa si el cliente no admite variables de entorno en cabeceras?* → se le indica cargar el
  secreto en el entorno del proceso; la UI no ofrece pegar la clave en el JSON. Basis: plan §3.2.
- *¿El selector debe recordar la elección?* → no; se reinicia a `Any MCP-compatible client` y no
  usa `localStorage`, cookies ni query. Basis: plan §3.1.
- *¿Se renombran `forClaude`/`needsClaude`?* → no; solo cambian las etiquetas visibles. Basis:
  plan §2.3.
- *¿Se actualiza el README?* → solo las etiquetas de UI que cambian; la narrativa de marketing
  queda fuera de alcance. Basis: constitución, Definition of Done (docs no pueden documentar
  botones inexistentes) y límite de alcance del plan.
- *¿Qué versión de OpenCode/Pi se prueba?* → la instalada que cumpla el mínimo (OpenCode 2.x, Pi
  con MCP integrado); si no está disponible, se registra como pendiente. Basis: supuestos del plan.

## The cost of not building it

Un dueño que usa OpenCode, OMP o Pi recibe un ZIP que no le enseña las reglas del producto: el
agente improvisa sin migraciones, sin control de acceso y sin las convenciones de plantilla, y el
envío falla o produce una versión insegura. El dashboard le ofrece una URL con la clave en claro y
un comando de Claude Code, así que la conexión de contenido queda fuera de su alcance o acaba
pegando la clave en un chat. Los textos "Copy for Claude" y "needs Claude" convierten una
capacidad del producto en una dependencia de proveedor.

## The cheapest alternative

Documentar en el README una sección "otros agentes" y dejar el código como está. No arregla
`AGENTS.md` (Next lo regenera y no contiene reglas), no da descubrimiento de la skill fuera de
Claude, no evita que la clave acabe en un prompt y no cambia los mensajes que exigen Claude. Sería
marketing sin el comportamiento.

## Out of scope

- Soportar OpenCode V1 ni instalar adaptadores MCP de terceros.
- Certificar todas las aplicaciones de agente; la compatibilidad es por capacidad.
- Instalar configuración de cliente en el servidor o añadir `opencode.json`, `.omp/mcp.json`,
  `.pi/mcp.json` o extensiones ejecutables al producto.
- Cambiar el API de herramientas MCP, los nombres de campos persistidos o las reglas de
  empaquetado/symlinks.
- Publicar una release o tocar `.github/workflows/image.yml`.
- Reescribir la narrativa de marketing del README más allá de las etiquetas de UI cambiadas.
