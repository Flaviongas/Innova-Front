# Municipal Aid & Emergency UI System

**Design direction:** Corporate Cartographic Interface  
**Visual identity:** Professional, restrained, map-aware, information-dense  
**Design principles:** Clarity, spatial awareness, modularity, consistency, visual hierarchy, confidentiality  
**Product:** Internal SPA for the Municipalidad de Temuco's aid and emergency management  
**Primary source:** [`proceso-interno-municipalidad.md`](./proceso-interno-municipalidad.md)  
**Documentation language:** English · **UI language:** Spanish (Chile, `es-CL`)

This document defines the visual language, components, page patterns, and interaction rules for the internal SPA that supports the process described in `proceso-interno-municipalidad.md`: case intake, professional evaluation, aid delivery, documentation, stock, and territorial reporting.

It does **not** replace or formalize the municipal procedure. Where the source describes current practice rather than a validated rule, the interface must remain configurable and the behavior must be confirmed with the municipality. Items marked **to confirm** are design assumptions, not approved policy.

> **Scope note:** This is an internal staff tool. A beneficiary-facing status portal, a complaints system, and a municipal budget system are outside the current scope. The source explicitly states that beneficiaries currently have no online case-status consultation and that complaints use existing municipal channels.

## What the system is and is not

| The system is | The system is not |
| --- | --- |
| An internal operations workspace for municipal staff | A beneficiary-facing portal or public status tracker |
| A case-centered record of evaluations, aids, documents, and deliveries | An automatic eligibility or aid-assignment engine |
| A territorial analysis tool with aggregate views | A public map of individual beneficiaries |
| A stock and document tracking layer for the aid process | A budget, payment-processing, or complaints system |
| A support tool for current practice | A formal municipal procedure or legal instrument |

## Source constraints that shape the UI

| Constraint from the current process | Design consequence |
| --- | --- |
| Aid decisions depend on a professional evaluation, not a rule table. | No automatic aid assignment by event type. Evaluation notes, evidence, and aid selection remain manual. |
| Cases are reviewed individually, even when an organization submits a list. | Batch intake is allowed; batch approval and batch delivery are not. |
| Warehouse goods, monetary aid, and construction materials follow different sequences and timelines. | Each aid has its own task list and status. The UI must not force every aid through one generic pipeline. |
| Urgent material aid may be delivered before paperwork is complete. | “Entrega urgente” is an explicit action that creates a visible **Pendiente de regularización** state and a follow-up task. It is not an error state. |
| Monetary aid requires administrative processing and authorization before payment. | Payment actions stay blocked until the required documents and authorization are complete, with the blockers visible. |
| Individual and family records are confidential. | Masking, role-based access, aggregate reporting, and no cross-family comparison. |
| Addresses are difficult to map to territories; streets can cross macrosectors. | Territory suggestions include confidence; manual correction is required and recorded. Never assign silently. |
| Reports must distinguish unique persons from attentions or gestiones. | Every metric states its unit. Territorial views include a **Personas / Atenciones** switch. |
| The source does not define required fields, the exact signature/decree sequence, or stock responsibilities. | These rules must be configurable and validated before implementation. Do not hard-code them. |

## Assumptions and open decisions

| Assumption | Status |
| --- | --- |
| Internal staff SPA | Confirmed by project context |
| Institutional authentication | Proposed — to confirm |
| Spanish (Chile) user-facing copy | Confirmed by the source document |
| Role-based access and permissions | Proposed — to confirm |
| Status vocabulary in this document | Proposed — to confirm |
| Integration with the existing social attention, document, and stock systems | Unknown — do not assume integration; use source-system references where needed |
| Digital signature for the acta de entrega | Unknown — support registration and file upload; legal validity to confirm |
| Offline or low-connectivity field use | Unknown — validate before designing offline behavior |
| Beneficiary online consultation | Out of scope — not part of the current process |
| Complaints and transparency requests | Out of scope — remain in existing municipal channels |

---

## 1. Design philosophy

The interface should follow these principles:

| Principle | Implementation |
| --- | --- |
| Territorial, not map-everywhere | The map is the primary workspace for territorial analysis and location context. Case work uses structured lists, forms, and detail views. |
| Case-centric | Every operational screen is anchored to a case, person, aid, document, or territory. Avoid orphan records. |
| Professional judgment first | The interface presents evidence and options; it never assigns an aid automatically from an event type. |
| Contextual | Controls and information appear close to the content they affect. |
| Modular | Information is organized into independent panels and sections. |
| Restrained | Blue is reserved for brand identity and meaningful interactions. |
| Dense but legible | Show substantial information without making the interface visually crowded. |
| Confidential by default | Show the minimum necessary data. Aggregate views are the default for territorial reporting. |

The visual language can be described as *calme visuel*: a predominantly neutral interface with carefully controlled blue accents.

**Important distinction:** The map is the main visualization for territorial information, not a decorative background. Other screens should retain the same visual language without forcing a map into contexts where it is unnecessary. A case detail, a stock table, or a document queue is not improved by adding a map.

**Non-negotiable rules:**

1. Never auto-approve an aid from an event type or a submitted list.
2. Never provide a batch “approve all” or “deliver all” action.
3. Never expose names, RUTs, or exact addresses in aggregate views or exported territorial reports.

---

## 2. Domain model and information architecture

### 2.1 Core entities

| Entity | Description | Key UI data |
| --- | --- | --- |
| Persona / familia | Person or family receiving attention. One person can have multiple attentions. | RUT (masked), name, contact, address, territory |
| Caso | A request or event that opens a file. | Folio, origin, event type, urgency, date, assigned professional, status |
| Evaluación | Professional field assessment. | Visit date, professional, “necesidad manifiesta”, observations, evidence, recommendation |
| Ayuda | A specific benefit within a case. | Type, program, items or amount, status, authorization, delivery date |
| Documento | Administrative support for the case or aid. | Type, status, responsible, signer or visador, file, observations |
| Movimiento de stock | Entry or exit of a warehouse item. | Item, quantity, reason, actor, date |
| Territorio | Territorial unit used for analysis and assignment. | Macrosector, unidad vecinal, comunidad rural, source, confidence |
| Atención / gestión | A recorded interaction with a person. | Date, program, benefit, professional, amount, observations, territory |
| Programa | Municipal program that funds or frames an aid. | Name, aid types, annual funds **to confirm** |
| Usuario / rol | Staff member and permissions. | Name, role, scope |

The distinction between a **person** and an **atención** is fundamental. A person can receive several aids and have several interactions. Territorial reports must be able to count either unique persons or the number of attentions, and must say which one is displayed.

### 2.2 Proposed status vocabulary

These labels are a starting point. Confirm the exact terms and transitions with the municipality before implementation.

| Level | Statuses | Notes |
| --- | --- | --- |
| Caso | Nuevo · En evaluación · En curso · Cerrado · Anulado | “En curso” covers one or more aids in progress. Closure rules **to confirm**. |
| Visita | Programada · Realizada · Reprogramada · No realizada | Reprogramming is not an error. Record the reason and contact attempt. |
| Ayuda | Evaluada · En trámite · Autorizada · Entregada / Pagada · Pendiente de regularización · Regularizada · Rechazada | Aid status is independent from case status. |
| Documento | Pendiente · En revisión · Visado · Firmado · Observado | Signature and visation are distinct states. |
| Stock | Disponible · Bajo mínimo · Agotado | Threshold-based; thresholds **to confirm**. |
| Urgencia | Urgente · Normal | Always labeled, never communicated by color alone. |

A case may contain zero, one, or many aids. Each aid has its own state and its own required documents. Do not collapse all of this into a single case badge.

### 2.3 Information architecture

```text
Panel
Casos
  ├── Bandeja de casos
  ├── Nuevo caso
  └── Detalle del caso
      ├── Resumen
      ├── Evaluación
      ├── Ayudas
      ├── Documentos
      └── Historial
Ayudas
  ├── Entregas
  ├── Pendientes de regularización
  ├── Ayudas monetarias
  └── Materiales de construcción
Bodega
  ├── Existencias
  ├── Movimientos
  └── Reposiciones
Documentos
  ├── Bandeja documental
  └── Firmas y visaciones
Territorio
  ├── Mapa
  ├── Macrosectores
  └── Cobertura territorial
Reportes
  ├── Reportes territoriales
  └── Exportaciones anonimizadas
Administración (role-restricted)
  ├── Programas y ayudas
  ├── Umbrales de stock
  ├── Territorios
  └── Usuarios y roles
```

**Navigation model:**

- **Global navigation** switches modules.
- **Local tabs** switch sections inside a case or a territory view.
- **Inspector** shows contextual detail without leaving the workspace.
- Keep the hierarchy to three levels. Deep nesting hides operational context.
- Important views should be URL-addressable, for example `/casos/AY-2026-000123/documentos` or `/territorio?macro=4&metrica=personas`.

### 2.4 Proposed role model

Confirm roles and permissions with the municipality. The UI should enforce them through server-side authorization, not only by hiding elements.

| Role | Primary work | Default data scope |
| --- | --- | --- |
| Profesional social | Intake, visits, evaluation, case follow-up | Assigned cases; individual data as needed |
| Unidad de emergencias | Urgent intake, referrals, urgent deliveries | Active emergency cases; operational data |
| Bodega | Stock, movements, delivery preparation | Stock and delivery items; no clinical notes |
| Documentos / administración | Document tracking, signatures, visations, decrees | Documents for assigned cases |
| Dirección / analista | Territorial analysis and reports | Aggregate data by default; individual data only with explicit permission |
| Auditor / solo lectura | Review and audit | Read-only, masked by default |
| Administrador | Programs, thresholds, territory master, users | Configuration; not automatic access to case content |

---

## 3. Color system

The palette is built around a municipal blue primary color taken from the official Temuco wordmark, with cool neutral surfaces and accent hues sampled from the same logo (cyan, lime, orange, red, navy). It is the product's visual system, not an assertion of official municipal brand colors. Confirm the use of the official wordmark and any institutional color requirements with the municipality.

### 3.1 Brand palette

| Token | Color |
| --- | --- |
| Primary blue | `#3574B5` |
| Hover | `#2E649E` |
| Active | `#275687` |
| Navy (logo) | `#060C66` |
| Bright blue (logo) | `#4B9FD4` |
| Pale | `#D9EDFA` |
| Tint | `#EFF7FD` |
| Sky (tint) | `#A9D6F5` |

The multi-colour wordmark is referenced by one restrained device: a 3px accent bar (`--gradient-logo`) across the top of the landing, panel and login headers, running blue → cyan → lime → orange → red. It is the only place where the full logo palette appears together; everywhere else those hues carry meaning (interaction, status, data).

### 3.2 Neutral palette

| Token | Color |
| --- | --- |
| White | `#FFFFFF` |
| Canvas | `#F5F8FB` |
| Border | `#E1E8F0` |
| Border subtle | `#EEF3F8` |
| Border strong | `#C9D5E2` |
| Muted | `#8A99A9` |
| Ink | `#102133` |
| Surface dark | `#0B1F3A` |
| Surface inverse | `#0E1726` |

### 3.3 Feedback and semantic colors

| Token | Color |
| --- | --- |
| Success (logo green) | `#4DB863` |
| Success strong (text on light) | `#2F7A45` |
| Warning (logo orange) | `#E8711F` |
| Warning strong (text on light) | `#A64A0A` |
| Warning wash | `#FFF4E6` |
| Warning border | `#F7D3A7` |
| Danger (logo red) | `#E42D24` |
| Danger strong (text on light) | `#B3261E` |
| Danger wash | `#FDECEA` |
| Information (logo blue) | `#4B9FD4` |
| Information strong (text on light) | `#1D5E8C` |

The base tokens are for fills and icons. The `strong` variants exist because the bright logo hues do not reach sufficient contrast as small text on white; always use the strong variant for status text. Washes are reserved for callouts that need a tinted background.

### 3.4 Semantic assignments

| Token | Color | Usage |
| --- | --- | --- |
| `primary` | `#3574B5` | Primary buttons, active navigation, selected map areas, selected polygon outline |
| `primary-hover` | `#2E649E` | Hovered primary actions |
| `primary-active` | `#275687` | Pressed states, dark brand surfaces |
| `primary-deep` | `#060C66` | Deepest brand gradient stops (logo navy) |
| `primary-subtle` | `#EFF7FD` | Selected rows, current case, subtle highlights |
| `background` | `#FFFFFF` | Main application surface |
| `surface-secondary` | `#F5F8FB` | Secondary content surfaces |
| `surface-dark` | `#0B1F3A` | Map stage in satellite mode |
| `surface-inverse` | `#0E1726` | Toasts and dark floating surfaces |
| `border` | `#E1E8F0` | Dividers, card borders, input outlines |
| `border-subtle` | `#EEF3F8` | Hairline dividers inside panels, progress tracks |
| `border-strong` | `#C9D5E2` | Emphasized borders, scrollbars, drag handles |
| `text-primary` | `#102133` | Headings and primary text |
| `text-secondary` | `#5A6B7D` | Descriptions and supporting information |
| `text-muted` | `#8A99A9` | Disabled controls and tertiary information |
| `sky` | `#A9D6F5` | Light cyan accents on dark surfaces |

### 3.5 Color usage rules

- Blue communicates interaction, selection, and brand identity. It is not a decorative wash.
- White is the dominant component surface.
- Cool gray-blue is used for secondary surfaces.
- Semantic colors indicate actual statuses, not decoration. Green, orange, and red are drawn from the logo but remain reserved for success, warning, and danger.
- Because the primary blue and the information blue are adjacent hues, **always pair status color with a text label or icon**. Never rely on color alone.
- Do not introduce additional saturated colors unless they encode meaningful information.
- Use red for destructive actions, errors, “Rechazada”, “Agotado”, and the “Urgente” badge. Do not use red merely to draw attention.
- Every color in the interface comes from the token tables above. No one-off hex values: hairlines use `border-subtle`, status text uses the `strong` variants, white surfaces use `surface`, white text on dark uses `text-inverse`. Translucent white overlays (`rgba(255, 255, 255, …)`) are allowed for glass effects over maps and photos.

### 3.6 Data visualization palette

Use category colors for aid types. Use the territorial scale for map intensity and ordered measures. Do not use semantic status colors as category colors; the category hues below are deliberately darker or more muted than their status neighbours.

| Aid category | Suggested color |
| --- | --- |
| Bienes de bodega | `#4B9FD4` |
| Ayuda monetaria | `#3574B5` |
| Materiales de construcción | `#B45309` |
| Apoyo social / derivación | `#65A30D` |
| Otras ayudas | `#8B8E8D` |

**Territorial scale** — use for choropleths and ordered intensity. Every exact count gets its own fill so the map reads as a count, not a relative heat. `territoryFill()` in `lib/data.ts` mirrors these buckets:

| Cases | Color |
| --- | --- |
| 0 | `#EFF7FD` |
| 1 | `#C6E3F8` |
| 2 | `#93CCF1` |
| 3 | `#5AA6DA` |
| 4 | `#3574B5` |
| 5+ | `#1D4F7A` |

Each macrosector also shows its current count as a bold map label at its widest interior point, with a white halo so it stays legible over streets and fills. Labels are hidden below zoom 12 so they do not crowd the map when zoomed out.

**Chart rules:**

- State the metric and its unit in the title: “Atenciones por macrosector”, “Personas únicas”, “Monto entregado (CLP)”.
- Show the period and the data source or last-update date.
- Limit categorical series to five or six. Group the rest as “Otras”.
- For macrosector comparisons, use a single series color and highlight the selected or compared territories. Do not assign a unique color to every macrosector.
- Use direct labels where possible; avoid relying on a legend alone.
- Provide a table alternative for every chart.
- Use patterns or outlines for the rural macrosector when color alone is insufficient.
- Do not show per-macrosector budget allocations. The source describes a common fund, not separate territorial budgets. Amounts shown by territory are recorded aid, not allocated budget.

---

## 4. Typography

**Recommended typeface: Inter.** It is suitable for interfaces with structured information, small labels, forms, tables, and navigation. Alternative: Manrope, if a slightly more geometric identity is desired.

### 4.1 Type scale

| Element | Size | Weight | Line height |
| --- | --- | --- | --- |
| Display | `clamp(40px, 4.6vw, 62px)` | 700 | 1.0 |
| Title | `clamp(28px, 3.3vw, 40px)` | 700 | 1.08 |
| Page title | 30px | 700 | 38px |
| Section title | 22px | 700 | 30px |
| Card title | 17px | 700 | 24px |
| Body | 15px | 400 | 22px |
| Secondary body | 14px | 400 | 20px |
| Caption | 13px | 500–600 | 18px |
| Navigation | 14px | 500 | 20px |
| Label | 13px | 500 | 18px |
| Metadata | 12px | 400 | 17px |
| Metadata micro | 10–13.5px in 0.5px steps | 400–500 | 1.3–1.45 |

Display is reserved for the landing hero and the login headline. Title is for section headings. Metadata micro sizes are only for compact metadata (badges, ticks, attributions, tooltips): always tabular numerals where numeric, always muted or secondary color, never for body copy.

### 4.2 Typographic rules

1. Use sentence case for headings, labels, and navigation. Write “Nuevo caso”, not “NUEVO CASO”.
2. Titles use bold (700); UI emphasis uses semibold (600); body text stays regular (400). Do not add extra weights beyond these three.
3. Keep supporting information visually subordinate.
4. Use tabular numerals for RUTs, amounts, stock quantities, dates, and counters.
5. Avoid unnecessarily large typography in information-dense panels.
6. Use uppercase only for short metadata labels, with slight letter spacing. Never use it for long text.

### 4.3 Numbers, dates, and identifiers

- Locale: `es-CL`.
- Dates: `dd-mm-yyyy`; time: 24-hour format.
- Currency: Chilean pesos, `$1.234.567`, no decimals.
- Percentages: comma decimal separator, for example `12,4 %`.
- RUT: formatted `12.345.678-9` when visible; masked by default in lists and aggregate views.
- Case folio: a stable, human-readable identifier. The exact format is **to confirm**; examples use `AY-2026-000123`.
- Always show the unit next to a number: “7 casos”, “12 personas”, “$450.000”, “24 unidades”.

### 4.4 Content and tone

- Use plain, respectful Chilean Spanish. Avoid bureaucratic jargon when a simpler label works.
- Prefer “persona” or “familia” in operational UI; use “persona beneficiaria” in formal documents and acts.
- Error messages state what happened, what to do, and whether data was saved.
- Never put sensitive details such as RUT, address, health information, or professional observations in notifications, toasts, or page titles.

---

## 5. Layout system

The application uses a strong spatial hierarchy:

- A global navigation bar.
- A case context bar when working inside a case.
- A primary application workspace.
- A contextual inspector or secondary panel.
- Localized controls associated with the workspace.

### 5.1 Application shell

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Municipalidad de Temuco   Panel  Casos  Ayudas  Bodega  ...  Cuenta │
├─────────────────────────────────────────────────────────────────────┤
│ Caso AY-2026-000123 · Persona · [En evaluación] · Urgente  Acciones │
├───────────────────────────────────────────────────┬─────────────────┤
│ MAIN WORKSPACE                                    │ INSPECTOR       │
│ Case detail, table, map, stock, or documents      │ Persona         │
│                                                   │ Territorio      │
│                                                   │ Documentos      │
│                                                   │ Alertas         │
└───────────────────────────────────────────────────┴─────────────────┘
```

The inspector is contextual. It may become a drawer or a full-width section on smaller displays.

### 5.2 Dimensions

| Element | Value |
| --- | --- |
| Navbar height | 60px |
| Case context bar height | 56px |
| Inspector width | 320px (min 300px, max 360px) |
| Content max width | 1440px |
| Standard table row | 44px |
| Minimum tap target | 44px |

### 5.3 Spacing scale

Use a 4px base spacing system.

| Token | Value | Typical application |
| --- | --- | --- |
| `space-1` | 4px | Icon-to-label spacing |
| `space-2` | 8px | Compact controls |
| `space-3` | 12px | Input and card internal spacing |
| `space-4` | 16px | Standard component spacing |
| `space-5` | 20px | Section separation |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Major section separation |
| `space-10` | 40px | Page-level separation |
| `space-12` | 48px | Large layout spacing |

### 5.4 Border radius

| Token | Value | Typical application |
| --- | --- | --- |
| `radius-xs` | 4px | Stamped status tags, tiny metadata |
| `radius-sm` | 6px | Small icon buttons, compact controls |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 10px | Small cards, map captions, stacked buttons |
| `radius-xl` | 12px | Cards |
| `radius-2xl` | 14px | Floating panels, popovers |
| `radius-3xl` | 16px | Dialogs, sheets, login card |
| `radius-full` | 9999px | Pills, avatars, circular indicators |

Joined surfaces (inspector tab, bottom sheet) combine a token with square corners, e.g. `var(--radius-md) 0 0 var(--radius-md)`. Circular indicators use 50%.

Prefer moderate rounding. The interface should feel professional and structured, not playful.

### 5.5 Shadows and elevation

| Elevation | CSS | Typical usage |
| --- | --- | --- |
| Level 0 | None | Main content surfaces |
| Level 1 | `0 1px 3px rgba(15, 35, 25, .08)` | Inputs, small cards |
| Level 2 | `0 4px 12px rgba(15, 35, 25, .10)` | Dropdowns, floating panels, map controls |
| Level 3 | `0 8px 24px rgba(15, 35, 25, .14)` | Modals and prominent contextual overlays |

Shadows differentiate floating interfaces from the workspace. Do not use them as decoration on every card.

### 5.6 Page header and case context

Every page has a page header with:

- Title and, where relevant, a short description.
- Breadcrumb when the page is nested.
- One primary action.
- Secondary actions in an overflow menu.

The case context bar appears below the global navigation when a case is open. It shows:

- Folio and masked person identifier.
- Current case status.
- Urgency, when applicable.
- Assigned professional.
- Primary action (“Registrar evaluación”, “Registrar entrega”, “Regularizar”).
- A link back to the case list, preserving filters.

The context bar stays visible while the user moves between case tabs. It is not a replacement for the case header inside the content area.

### 5.7 Density

Use two density modes with the same tokens:

- **Comfortable:** forms, case detail, evaluation, inspector.
- **Compact:** case tables, stock tables, document queues, report results.

Density changes spacing and row height, not typography scale or color semantics.

---

## 6. Component library

Components should be reusable across modules. The `ui/` layer contains primitives; domain components compose them.

### 6.1 Navigation

**Brand area:** official municipal wordmark or approved text lockup, plus the system label “Ayudas y Emergencias”. Do not invent a coat of arms or alter the official mark.

**Primary navigation:**

`Panel · Casos · Ayudas · Bodega`

**Account area:** user name, role, “Administración” when permitted, “Cerrar sesión”.

| Property | Value |
| --- | --- |
| Height | 60px |
| Background | White |
| Horizontal padding | 24–32px |
| Bottom border | 1px neutral |
| Active indicator | 2px primary-blue underline |
| Position | Sticky at top |

**Rules:**

- Do not create a different navigation style for every page.
- Role-based items are hidden when the user has no access. Do not show a broken or empty module.
- On mobile, primary navigation collapses into a drawer. Reserve a four-item bottom bar (`Panel`, `Casos`, `Ayudas`, `Bodega`) for a validated field-use mode; do not use both patterns at once.
- The current section is always visible in the header.

### 6.2 Buttons

| Variant | Usage | Examples |
| --- | --- | --- |
| Primary | The main action in a section | “Nuevo caso”, “Guardar evaluación”, “Registrar entrega” |
| Secondary | Alternative or supporting actions | “Reprogramar visita”, “Adjuntar documento”, “Ver historial” |
| Ghost | Low-emphasis navigation or cancellation | “Cancelar”, “Volver” |
| Warning | High-stakes action that creates a follow-up obligation | “Entrega urgente”, “Solicitar reposición” |
| Destructive | Actions that delete, annul, or irreversibly modify | “Anular caso”, “Eliminar documento” |

| Property | Standard |
| --- | --- |
| Height | 36–40px; 44px on mobile |
| Horizontal padding | 14–16px |
| Font size | 13px |
| Font weight | 500 |
| Radius | 8px |
| Icon gap | 8px |

**Button rules:**

- One visually primary button per section.
- The warning variant is reserved for actions that create a regularization or stock obligation. Do not use it for ordinary actions.
- Destructive actions require a confirmation dialog with an explicit consequence.
- Loading buttons keep their label and show a spinner. Disable the button while the action is in progress to prevent duplicate submissions.
- Disabled buttons must explain why they are disabled, either inline or through a tooltip when the reason is not obvious.

### 6.3 Inputs and search

| Property | Value |
| --- | --- |
| Height | 38–42px |
| Border | `1px solid #E3E9E5` |
| Background | White |
| Focus border | Primary blue |
| Focus ring | Subtle blue translucent outline |
| Placeholder | Secondary text |
| Label | Always visible when the input requires context |

**Search patterns:**

- Global case search by RUT, name, or folio.
- Search by address when validating territory.
- Debounce typing where appropriate; show an explicit loading state.
- Show result count and the active filter summary.
- Provide clear, empty, error, and permission-denied states.

**RUT field:**

- Format as the user types.
- Validate the check digit.
- Search for an existing person before creating a new case to reduce duplicates.
- Mask the RUT in lists and on screens where full identification is not required.

**Selects:**

- Macrosector, unidad vecinal, comunidad rural.
- Aid type, program, status, urgency.
- Use a searchable select when the list is long.
- Never use a select for a free-text professional observation.

**Textareas:**

- “Necesidad manifiesta” and professional observations need generous height and a character count.
- Do not truncate the saved text in the detail view; use expandable sections.
- Respect role-based visibility for sensitive notes.

**File upload:**

- Support evidence photos, social reports, signed acts, and other antecedents.
- Show accepted formats, size limit, upload progress, and a remove action.
- Show a privacy reminder before uploading documents with personal data.
- Never upload silently. The user must confirm the file and its classification.

**Signature registration:**

- Record who signed: beneficiary, family member, neighbor, or other.
- Record the relationship and the reason when the beneficiary cannot sign.
- Support a signature image or a scanned acta **to confirm**.
- Do not claim legal validity for an electronic signature until the municipality confirms it.

**Validation:**

- Show errors inline, below the field, in the danger color.
- Provide a summary at the top of long forms with links to each invalid field.
- Preserve all entered data after a validation error.
- Mark required fields clearly. The list of required fields is **to confirm**.
- Autosave long forms as drafts when possible. Show “Guardado hace 2 min” or “Cambios sin guardar”.

### 6.4 Cards

Cards are the main building blocks for non-map sections.

**Metric card**

```text
Casos activos
128
+12 esta semana
```

**Alert card**

```text
Stock bajo mínimo
4 artículos requieren reposición
Revisar bodega →
```

**Summary card**

```text
Ayudas del mes
$12.450.000
38 entregas · 31 personas
```

| Property | Value |
| --- | --- |
| Background | White |
| Radius | 12px |
| Border | 1px neutral |
| Padding | 16px |
| Internal spacing | 12–16px |
| Title/action alignment | Horizontal, title left, action right |

Cards should have a consistent structure. Do not create arbitrary decorative variations. Clickable cards need hover, focus, and pressed states.

### 6.5 Tables

> **Status: specified, not yet built.** The current queues use row lists. When tables arrive, they follow this spec.

Tables are the primary workspace for case queues, stock, documents, and reports.

| Property | Value |
| --- | --- |
| Row height | 44px compact; 52px comfortable |
| Font size | 13px |
| Header | Sticky, 12px label, semibold |
| Border | Horizontal dividers only; no heavy grid |
| Selection | Checkbox column only when safe bulk actions exist |
| Pagination | 25 / 50 / 100 rows, with total count |
| Sorting | Visible sort indicator; one primary sort at a time |
| Row action | Click opens detail; explicit action menu for secondary actions |

**Case table columns:** Folio · Persona (masked) · Territorio · Tipo de ayuda · Estado · Urgencia · Profesional · Fecha.

**Stock table columns:** Ítem · Categoría · Existencias · Mínimo · Estado · Último movimiento.

**Document table columns:** Documento · Caso · Responsable · Estado · Última actualización.

**Bulk actions:**

- Allowed: assign professional, export selection, add a tag or classification, change a queue.
- Not allowed: approve aids, mark as delivered, sign documents, or close cases in bulk.
- Every bulk action shows the number of affected records and requires confirmation.

**States:**

- Loading: skeleton rows that preserve column widths.
- Empty: explain why the table is empty and offer a recovery action.
- Error: show the error, a retry action, and a support reference.
- Permission denied: explain the restriction without revealing protected data.

**Mobile:** convert rows to cards with the priority fields. Do not require horizontal scrolling for the primary action.

### 6.6 Badges and status indicators

Use stamped outline tags for compact metadata and statuses: transparent surface, 1px outline in the tone color, sentence-case text label. Never use filled pastel pills, and never rely on color alone — the label carries the meaning.

| Status | Badge tone |
| --- | --- |
| Nuevo | Info |
| En evaluación | Info |
| En curso | Info |
| Cerrado | Success |
| Anulado | Neutral |
| Entregada / Pagada | Success |
| Pendiente de regularización | Warning |
| Regularizada | Success |
| Rechazada | Danger |
| Documento pendiente | Neutral |
| Documento observado | Warning |
| Firmado / Visado | Success |
| Stock bajo mínimo | Warning |
| Agotado | Danger |
| Urgente | Danger, always labeled “Urgente” |

Avoid turning every data attribute into a badge. Use normal text for descriptive information, dates, names, and long labels.

### 6.7 Tabs and accordions

> **Status: specified, not yet built.** Case sections currently render as stacked content; the tab contract below applies when navigation between them is added.

**Case tabs:** Resumen · Evaluación · Ayudas · Documentos · Historial.

- Tabs are URL-addressable.
- Preserve the active tab when the user refreshes or returns from a dialog.
- Do not hide required actions in a collapsed section.

**Inspector accordions:** Persona · Territorio · Documentos · Alertas.

- Header remains visible when collapsed.
- The collapse indicator communicates the current state.
- Preserve the user’s open/closed selection when possible.
- Support keyboard navigation.
- Avoid excessive animation.

### 6.8 Timeline and history

> **Status: specified, not yet built.**

The timeline is used for case events and for the person’s attention history.

**Case timeline events:** creation, referral, visit scheduled, visit completed, evaluation saved, aid created, document requested, document signed or observed, delivery registered, regularization completed, case closed.

Each event shows:

- Date and time.
- Actor and role.
- Action and short description.
- Source system, when the record comes from an external system.
- A link to the related aid or document.

**Person history:** a separate view of all attentions for a person, with date, program, benefit, professional, amount when applicable, and territory. Distinguish this from the case timeline. Do not merge them into one undifferentiated feed.

**Rules:**

- Group events by day.
- Allow filtering by event type.
- Do not expose restricted notes to users without permission.
- Never show another family’s history for comparison.

### 6.9 Document tracker

The document tracker shows the administrative support for a case or aid.

**Document types:** Informe social · Acta de entrega · Decreto municipal · Otros antecedentes.

**Each row shows:**

- Document type and required/optional state.
- Status: Pendiente, En revisión, Visado, Firmado, Observado.
- Responsible person.
- Signer or visador, when applicable.
- Last update.
- File preview or download action.
- Observations.

**Rules:**

- Show blockers prominently: “Falta firma del acta” or “Decreto pendiente”.
- Signature and visation are separate. Do not use one status for both.
- For an acta signed by a family member or neighbor, record the signer type and relationship.
- If the person is not at home for a non-urgent aid, link the reschedule action from the visit, not from the document row.
- The formal sequence of signatures, visations, and decree is **to confirm**. Make the required document set configurable per aid type.

### 6.10 Stock components

**Stock level bar:** shows current quantity, minimum threshold, and status. The threshold marker must be visible.

**Stock alert:** “Bajo mínimo” or “Agotado”, with the affected item and a link to the movement history.

**Movement table:** date, item, quantity in/out, reason, actor, and related case or aid.

**Delivery check:** when registering a delivery that uses stock, show availability before confirmation. If stock is insufficient, block or require an explicit, recorded justification. Do not silently allow negative stock.

**Annual funds note:** if program funds are exhausted, the source describes an internal loan or reassignment request to Presupuesto Municipal. The SPA may record a note or request reference, but budget approval remains outside the system. The exact workflow is **to confirm**.

### 6.11 Territory selector and address matcher

This is a core domain component, not a generic select.

**Hierarchy:**

- Macrosector: 10 official polygons (Labranza, Botrolhue, Poniente, Amanecer, Centro, Costanera del Cautín, Pueblo Nuevo, Pedro de Valdivia, Ñielol, El Carmen), vendored from the municipal open-data service. This is the primary unit because residents recognize it better than the unidad vecinal.
- Unidad vecinal: 32 urban + 4 rural.
- Sector rural operativo: the interview describes a rural macrosector, but the published service contains only the 10 named above. The app keeps a rural entry without official geometry until the municipality confirms it.
- Comunidad rural: when the rural macrosector is selected. The source suggests communities may represent the territory better; confirm whether this is the usual working unit.

**Address matcher:**

- Look up the street in the municipal street master.
- Suggest a macrosector and unidad vecinal.
- Show a confidence level: Alta, Media, Baja, Sin asignar.
- If a street crosses several macrosectors, show the candidates and require a choice. Do not pick one silently.
- Allow manual override with a required reason.
- Record who assigned the territory and when.
- Show “Dirección no verificada” when the match is low confidence or manual.

**Bulk validation view:**

- List addresses without a territory or with low confidence.
- Show suggested matches and the source.
- Allow correction and confirmation.
- Show coverage: “82 % de las direcciones validadas”.
- This view directly supports the manual work described in the source and should be part of territorial reporting, not an afterthought.

### 6.12 Dialogs and confirmations

Use dialogs for high-impact decisions, not for ordinary navigation.

| Dialog | Content |
| --- | --- |
| Entrega urgente | Summary of the aid, reason, authorizer **to confirm**, and a notice that the case will remain “Pendiente de regularización” |
| Registrar pago | Authorization and document checklist, blockers, amount, payment reference |
| Cerrar caso | Unresolved aids or documents, consequence, confirmation |
| Anular caso | Reason, consequence, destructive confirmation |
| Exportar reporte | Scope, metric, period, anonymization options, row count, format |
| Eliminar documento | File name, consequence, destructive confirmation |

**Behavior:**

- Focus trap inside the dialog.
- Escape closes unless the action is in progress.
- Return focus to the trigger.
- Do not close on backdrop click for destructive or high-stakes actions.
- Show the number of affected records.

### 6.13 Feedback and states

- **Inline alert:** form errors, blockers, confidentiality notices, partial data warnings.
- **Toast:** confirmation of a completed action, such as “Evaluación guardada” or “Entrega registrada”. Toasts are not a substitute for persistent blockers.
- **Persistent alert:** pending regularization, stock below minimum, document observed, territory unassigned.
- **Empty state:** explain the absence of data and offer the next action.
- **Loading state:** preserve layout and avoid jumping.
- **Error state:** explain what failed, what to do next, and how to reference the problem.

**Example messages:**

- “No hay casos con estos filtros.” + “Limpiar filtros”
- “Sin movimientos registrados para este ítem.”
- “No se pudo cargar el mapa.” + “Reintentar”
- “Sin territorio asignado.” + “Asignar territorio”
- “Tu rol no permite exportar datos individuales.”

---

## 7. Map and territory system

The map is the most distinctive workspace for territorial analysis. It is not the default way to browse individual cases.

### 7.1 Map surface

- Desaturated cartographic colors.
- Light gray roads.
- Muted blue-gray geographic areas.
- Subtle labels.
- Low-contrast base features.
- Stronger contrast reserved for application overlays, selected areas, and data layers.

The map should never compete with information panels.

Suggested map tokens:

| Token | Value |
| --- | --- |
| `--map-land` | `#EAECEB` |
| `--map-water` | `#D7E3DF` |
| `--map-road` | `#F4F6F5` |
| `--map-boundary` | `#A0AAA4` |
| `--map-label` | `#69766F` |

### 7.2 Default view: aggregate territory

The default map view is a choropleth of macrosectors for a selected metric and period.

- Metrics: personas únicas, atenciones, monto entregado, conteo de ayudas por tipo.
- Period: month, quarter, year, or custom range.
- Legend: sequential blue scale with explicit values and unit.
- The title states the metric, period, and unit.
- A table alternative is always available.
- Rural areas use a pattern or outline where needed; do not rely on color alone.
- Suppress very small counts in shared reports **to confirm** the threshold.

**Do not imply per-macrosector budgets.** If amounts are shown, label them as recorded aid, not allocated budget.

### 7.3 Operational view: cases and locations

Individual case markers are available only to authorized operational roles.

- Exact addresses are sensitive. Do not expose them in aggregate or public views.
- Default tooltips show folio, macrosector, aid type, status, and urgency. Names and RUTs are masked or omitted unless the role requires them.
- The selected polygon gets a heavier outline and stronger fill; clicking a polygon opens the inspector.
- Do not use fill color as the only indicator of urgency or status. Pair with shape or label.

| Polygon property | Value |
| --- | --- |
| Boundary | 1.2px primary at 45% opacity |
| Fill | Territorial scale by active cases (`territoryFill()`), 42% opacity |
| Selected state | 2.5px outline at 90% opacity, 60% fill, brought to front |
| Hover | Heavier outline |
| Tooltip | Sticky, name plus active-case count |

Polygons come from the vendored official file (`public/data/macrosectores.geojson`), joined to app sectors by exact `macrosect` name (`OFFICIAL_TO_ID` in `lib/macrosectores.ts`). Fly-to targets are polygon bounding-box centers computed at runtime. The rural operational entry has no published geometry and never matches a polygon.

### 7.4 Layers

| Layer | Purpose |
| --- | --- |
| Macrosectores | Primary territorial analysis; 10 official municipal polygons (vendored GeoJSON) |
| Unidades vecinales | Secondary detail; 32 urban + 4 rural |
| Comunidades rurales | Rural representation, when confirmed |
| Casos (authorized) | Operational location view |
| Cobertura de direcciones | Data quality: validated, low confidence, unassigned |
| Maestro de calles | Reference for address matching |

The municipality has a public interactive map, but the source states that report information is not automatically linked to it. Do not assume that linkage; treat it as an integration **to confirm**.

### 7.5 Map controls

Place controls over the canvas in compact white surfaces with slight elevation.

- Basemap selector (map/satellite), if a satellite layer is available.
- Layer selector.
- Metric selector.
- Period selector.
- Aid type and program filters.
- Search by address or territory.
- Zoom in/out.
- Fullscreen.
- Location button, if the use case is confirmed.
- Legend toggle.

### 7.6 Inspector

The inspector is the contextual panel for the selected territory or case.

**Territory inspector:**

- Territory name and level.
- Case counts, and population context when available, with unit.
- Aid distribution by type.
- Amounts, labeled as recorded aid.
- Data coverage and confidence.
- Comparison with another macrosector, only in an authorized analytical view.

**Case inspector:**

- Person and contact, masked as needed.
- Territory and assignment confidence.
- Current case status and urgency.
- Assigned professional.
- Aids in progress.
- Document blockers.
- Primary action.

| Property | Value |
| --- | --- |
| Desktop width | 320px |
| Internal padding | 16px |
| Section spacing | 8–12px |
| Radius | 14px |
| Surface | White with subtle elevation |
| Maximum height | Viewport-constrained |
| Scrolling | Independent vertical scroll |
| Behavior | Collapsible; content adapts to selection |

### 7.7 Reports and exports from the map

- “Exportar vista” opens a report dialog, not an immediate download.
- The dialog states the metric, period, territory level, and unit.
- Anonymization is on by default for territorial exports: no names, no RUTs, no exact addresses.
- Show the row or area count before export.
- Include a footnote in the exported file: source, date, metric definition, and “Datos agregados; no incluyen nombres ni RUT”.
- Do not allow an individual-level export from a territorial report view without a separate, permissioned workflow.

---

## 8. SPA page architecture

### 8.1 Application structure

```text
Global application shell
Navigation · Case context · Account · Alerts

Panel
Casos
Ayudas
Bodega
Documentos
Territorio
Reportes
Administración

Shared component and token system
Buttons · Inputs · Cards · Tables · Filters · Dialogs · Timeline · Badges
```

### 8.2 Page patterns

| Page | Layout | Primary component |
| --- | --- | --- |
| Panel | Dashboard grid with alert strip | Metric cards, alerts, recent cases |
| Casos | Table + filter bar | Case table |
| Nuevo caso | Form with context aside | Intake form |
| Detalle del caso | Context bar + tabs + inspector | Case sections, timeline |
| Evaluación | Form with context aside | Evaluation form |
| Ayudas | Table + detail drawer | Aid table |
| Bodega | Metric strip + table | Stock table |
| Documentos | Table + preview | Document tracker |
| Territorio | Map + inspector | Choropleth, legend, territory summary |
| Reportes | Form + preview | Report builder |
| Administración | Settings layout | Forms and tables |
| Autenticación | Split screen: institutional panel + form card | Expediente login |
| Landing | Full-bleed live map + paper sheet + ledger | Territory hero, aid timeline |

### 8.3 Panel

The Panel is the operational home. It should answer:

- What needs attention now?
- What is pending regularization?
- What stock is below minimum?
- Which documents are observed or awaiting signature?
- Which visits are scheduled?

Recommended composition:

1. Operational alerts in the notification popover: stock crítico, casos recibidos sin atender.
2. Metric cards: casos activos, atenciones del mes, ayudas entregadas, pendientes de regularización.
3. Recent cases table.
4. Today’s visits.
5. Territory snapshot, optional.

Do not turn the Panel into a chart gallery. Charts belong in Territorio and Reportes.

### 8.4 Casos

**Case queue (implemented at `/panel?vista=casos`):**

- Summary strip: total, recibidas, en proceso, entregadas. Counts come from the API; empty territories stay at zero.
- Filters: estado, categoría, tipo de ayuda. Search by código, título, dirección, sector, category or help type.
- Default sort: most recent update first. The result count is always visible above the table.
- Row click opens the shared case drawer for state changes, editing, and delivery recording.
- Loading, error, forbidden, empty and no-match states each get their own message with a recovery action where possible.
- Saved filters are useful but **to confirm**.

**New case:**

- Search for an existing person by RUT before creating a new record.
- Record origin: demanda espontánea, derivación institucional, aviso de emergencia.
- Record channel: presencial, teléfono, correo, WhatsApp, otro.
- Record referrer and institution as free text, because there is no standardized referral form. Typical referrers include Bomberos, the Dirección de Riesgos y Desastres, SENAPRED, and other institutions.
- Record event type as context, not as an automatic aid rule.
- Record urgency.
- Record address and territory, with confidence.
- When the case is registered in the field, capture the device GPS location alongside the written address. The written address stays mandatory: GPS precision varies and does not replace the territorial reference.
- Add attachments and notes.
- If an organization submits a list, use batch intake to create individual cases. The list is not pre-approved.
- Save as draft or create the case.

**Case detail:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Caso AY-2026-000123 · Persona (masked) · [En evaluación] · Urgente  │
│ Macrosector 4 · Profesional asignado · [Registrar evaluación]       │
├───────────────────────────────────────────────────────┬─────────────┤
│ Resumen | Evaluación | Ayudas | Documentos | Historial │ Persona     │
│                                                       │ Territorio  │
│ Main content                                          │ Documentos  │
│                                                       │ Alertas     │
└───────────────────────────────────────────────────────┴─────────────┘
```

The case detail is the core workspace. It should make the following obvious:

- Who the case is about, with appropriate masking.
- Where the person is located and how confident the territory assignment is.
- What has been evaluated and by whom.
- Which aids exist and what state each one is in.
- Which documents are missing or blocked.
- What the next action is.

### 8.5 Ayudas

The Ayudas module focuses on delivery and follow-through, not intake.

**Views:**

- Entregas: all aid records, with status and blockers.
- Pendientes de regularización: urgent deliveries awaiting paperwork.
- Ayudas monetarias: cases awaiting authorization or payment.
- Materiales de construcción: quantification, transport, and delivery coordination.

**Aid detail:**

- Case and person context.
- Aid type and program.
- Items or amount.
- Status and blockers.
- Required documents.
- Delivery or payment record.
- Regularization tasks, when applicable.
- Timeline.

### 8.6 Bodega

- Stock overview with low-stock and out-of-stock alerts.
- Item detail with movements and threshold.
- Delivery preparation.
- Reposition request or note.
- Annual funds exhaustion note, if applicable.
- No clinical or social detail beyond what the delivery requires.

### 8.7 Documentos

- Document queue with filters by status, type, responsible, and case.
- Signature and visation queues.
- Decree tracking.
- Document preview and observations.
- Blockers that link back to the case or aid.

### 8.8 Territorio

- Map with aggregate metrics.
- Macrosector comparison table.
- Coverage and data-quality panel.
- Personas / Atenciones switch.
- Rural view with communities.
- Export to Reportes.

Differences in demand between territories are expected. The interface should make them visible for analysis without presenting them as budget entitlements. The source describes a common fund, not separate budgets per macrosector.

### 8.9 Reportes

The report builder should make the manual Excel work less repetitive, without pretending to replace formal accountability. It can support the preparation of the rendición, but the official format and approval flow are **to confirm**. The source estimates that a program analysis can take about a month and that consolidating the Dirección’s information can take three or four months. Those figures are referential and must not become service-level targets.

**Inputs:**

- Territory level: macrosector, unidad vecinal, comunidad rural.
- Period.
- Program and aid type.
- Metric: unique persons, attentions, amount, aid count.
- Grouping and sort.
- Anonymization options.

**Preview:**

- Table and chart.
- Definitions: “Persona única” and “Atención”.
- Data source and last update.
- Coverage warning when territory assignment is incomplete.

**Export:**

- CSV, XLSX, or PDF **to confirm** the formats actually needed.
- No names, RUTs, or exact addresses by default.
- Small-number suppression **to confirm**.
- Footnote with source, date, and metric definition.

Optional aggregate vulnerability or sociodemographic context may be added for collective requests, as described in the source. The data source, granularity, and permissions are **to confirm**.

### 8.10 Administración

Role-restricted configuration:

- Programs and aid catalog.
- Stock thresholds.
- Territory master and aliases.
- Users and roles. Accounts are provisioned internally; there is no public self-registration.
- Audit log.

Do not expose configuration to operational roles by default.

### 8.11 Out of scope

- Beneficiary-facing case status portal.
- Public complaint submission.
- Municipal budget approval.
- Payment processing.
- Replacing the municipality's formal document, social attention, or stock systems of record. The SPA may integrate with or reference them; system boundaries are **to confirm**.

Existing municipal channels remain responsible for complaints, transparency requests, and ClaveÚnica-based services where applicable.

### 8.12 Landing

The public landing has one job: establish institutional trust and hand off to the login. Its only image is the territory itself.

- **Hero:** full-bleed live map (same Leaflet stack as the panel, scroll-zoom disabled so it never traps page scroll) with the headline on a single paper sheet. A caption tag shows the selected macrosector and its active cases; clicking markers updates it.
- **Ledger strip:** territory facts as one hairline-divided tabular row, not cards.
- **Aid timeline:** the three aid types on a ruled horizontal line ordered by referential timeframe, not three identical cards. Structure encodes the time information.
- **Transparency section:** dark brand surface, aggregate figures only, no personal data.
- No kicker pills, no appended arrows except the single primary call to action.

### 8.13 Login

Split screen: a dark institutional panel with an expediente file-head (`Expediente de acceso` plus an outlined `Uso interno` stamp) over a faint real-polygon territory texture, and a quiet form card (`Ingresar`, institutional email, password, demo entry). One primary action keeps its arrow; secondary links carry none.

---

## 9. Forms, workflows, and states

### 9.1 Global interaction states

Every interactive component should define:

| State | Visual behavior |
| --- | --- |
| Default | Neutral border and background |
| Hover | Subtle background change |
| Focus | Visible blue focus ring |
| Active | Primary color emphasis |
| Selected | Light blue background and blue indicator |
| Disabled | Reduced contrast, no interaction, explained reason |
| Loading | Progress indicator, stable layout |
| Error | Semantic danger color and explanatory text |
| Empty | Helpful message and recovery action |

**Interaction principles:**

- **Navigation:** the active page uses the blue underline; do not create multiple active styles.
- **Selection:** selected rows, cases, and filters use a visible indicator and `primary-subtle` background. Never communicate selection by color alone.
- **Panels:** expand and collapse without unnecessary reflow of the underlying workspace.
- **Search:** support keyboard submission, debouncing where appropriate, and explicit loading feedback.
- **Map:** selecting a marker opens a contextual tooltip or inspector with the corresponding details.

### 9.2 Intake workflow

1. Search for an existing person.
2. If found, open the person history and create a new case or attention.
3. If not found, create the person record.
4. Record origin, channel, referrer, event type, urgency, address, and territory.
5. Add attachments.
6. Save as draft or create the case.
7. Assign a professional, if the role permits.

**Rules:**

- Do not require a standardized referral form that does not exist. Allow free-text referrer and institution.
- Do not auto-create an aid from the event type.
- Do not merge cases silently. If a duplicate is suspected, show both records and require a decision.

### 9.3 Evaluation workflow

1. Schedule or record the visit.
2. Record the visit outcome: realizada, reprogramada, no realizada.
3. Record the professional assessment and “necesidad manifiesta”.
4. Add evidence and observations.
5. Recommend one or more aids manually.
6. Save as draft or submit the evaluation.

**Rules:**

- The evaluation is the decision support, not an automatic approval.
- Aid selection is manual, even when the event type is common.
- A professional can evaluate a case without immediately creating an aid.
- Long evaluations autosave as drafts and warn about unsaved changes.

### 9.4 Aid delivery workflows

**Bienes de bodega:**

1. Select items and quantities.
2. Check stock availability.
3. Prepare the delivery.
4. Register the acta and signature.
5. Deduct stock and record the movement.
6. Mark the aid as delivered.

**Entrega urgente:**

1. The user chooses “Entrega urgente”.
2. The dialog explains that the case will remain pending regularization.
3. Record the reason and, if required, the authorizer.
4. Register the delivery and stock movement.
5. Create a persistent regularization task.
6. The case shows “Pendiente de regularización” on the Panel and in Ayudas.

Urgent delivery is valid current practice. It must not look like a system error or a bypass. It must, however, remain visible until regularized.

**Ayuda monetaria:**

1. Complete the administrative process.
2. Attach the required documents.
3. Obtain authorization.
4. Register the payment.
5. Mark the aid as paid.

The payment action stays blocked until the required documents and authorization are complete. Show the blockers, not just a disabled button.

The source estimates one month or more for this aid type. If the UI shows a timeframe, label it “Referencial” and keep it configurable. It is not a service-level commitment.

**Materiales de construcción:**

1. Schedule the visit.
2. Quantify the materials.
3. Record the line items and quantities.
4. Coordinate transport.
5. Register the delivery.
6. Complete the acta and documents.

The source estimates one or two months for this aid type. If the UI shows a timeframe, label it “Referencial” and keep it configurable. It is not a service-level commitment.

### 9.5 Regularization workflow

- A queue of aids pending regularization.
- Checklist of missing documents and signatures.
- Upload or link the signed acta and other antecedents.
- Record the decree or authorization reference.
- Mark as regularized.
- Keep the original urgent delivery record intact.
- Audit who regularized the case and when.

The exact document set and sequence are **to confirm**.

### 9.6 Rescheduling

- Reprogramming is uncommon in emergencies; it is mainly relevant for non-urgent visits when the person is absent.
- Reprogramming is not an error state.
- Record the reason, for example: person absent, access problem, weather, other.
- Record contact attempts: date, channel, result.
- Schedule the new visit.
- Keep the original visit in the history.
- Do not mark the case as abandoned automatically.

### 9.7 Closure

- Closing a case checks for unresolved aids, pending documents, and pending regularization.
- If unresolved items exist, show a warning and require an explicit decision.
- Record the closure reason and actor.
- Do not allow closure to hide a pending regularization.
- Closure rules are **to confirm**.

### 9.8 Batch rules

- Batch intake: allowed.
- Batch assignment of a professional: allowed, with confirmation.
- Batch export: allowed, with anonymization controls.
- Batch approval, delivery, signature, or closure: **not allowed**.
- A submitted list from an organization is a batch of cases to review individually, not an approved list.

### 9.9 Forms and validation

- Group fields into meaningful sections.
- Use a single-column layout for complex forms; use two columns only for short, related fields.
- Keep labels visible.
- Show required and optional fields consistently.
- Validate on blur and on submit; do not interrupt typing with aggressive validation.
- Show a summary of errors at the top of long forms.
- Preserve data after errors and navigation warnings.
- Confirm before leaving a form with unsaved changes.
- Do not clear a form after a failed submission.

### 9.10 Search and filtering

- Search and filters are independent; show the active filter summary.
- Preserve filters when opening a case and returning to the list.
- Show result counts.
- Provide a clear-all action.
- Debounce text search; avoid searching on every keystroke when the dataset is large.
- Support keyboard submission.

### 9.11 Comparison

- Comparison is territorial and aggregate: macrosectors, periods, aid types.
- Comparison is not available for individual families.
- Selected comparison items persist independently of the current table filters.
- Comparison views must state their metric and unit.
- Comparative justifications are produced only when requested and authorized, as described in the source.

### 9.12 Animation

- Hover transitions: 120–180ms.
- Panel transitions: 180–240ms.
- Dialog transitions: 180–220ms.
- Prefer ease-out.
- Respect `prefers-reduced-motion`.
- Do not animate data updates in a way that obscures the change.

---

## 10. Privacy, confidentiality, and access

Confidentiality is a system requirement, not a footer notice.

### 10.1 Data classification

| Class | Examples | Default handling |
| --- | --- | --- |
| Individual / family | Name, RUT, address, contact, social report, professional observations | Confidential; role-based access; masked where possible |
| Case operational | Folio, territory, aid type, status, urgency, assigned professional | Internal; visible to operational roles |
| Document | Acta, decree, visation, signature | Restricted to assigned roles; preview logged |
| Aggregate | Counts and amounts by territory | Shareable after anonymization and small-number review |
| Configuration | Users, roles, thresholds, territory master | Admin-only |

### 10.2 Access rules

- Enforce authorization on the server. UI masking is not a security boundary.
- Mask RUTs and names in lists by default. Reveal full identity only in a detail view when the role requires it.
- Record access to sensitive documents and exports in an audit log **to confirm** the retention period.
- Restrict sensitive professional observations to roles that need them; do not expose them in tables, exports, or map tooltips.
- Exact addresses and individual markers are available only to operational roles that need them.
- Aggregate and analytical roles see territory summaries, not individual case rows, by default.
- Staff must not use the system to compare one family’s benefits with another’s, and the system should not offer a cross-family comparison view.
- Administrators manage configuration but do not automatically gain access to case content.

### 10.3 Reporting and export rules

- Territorial reports use aggregate data.
- Remove names, RUTs, and exact addresses by default.
- Review small counts before sharing; suppress cells below an agreed threshold **to confirm**.
- State the metric definition, period, source, and date.
- Do not combine a small territory with sensitive attributes in a way that could re-identify a person.
- Comparative reports are produced only for authorized requests, such as those from concejales or territorial representatives.
- The export dialog shows exactly what will be included before download.

### 10.4 Visual treatment

- Use a small lock icon and “Datos confidenciales” notice in document and export contexts.
- Do not place a large confidentiality banner on every screen; it becomes noise.
- Use contextual notices where the risk is real: exports, document previews, aggregate views, and permission changes.
- Never use sensitive data as example content in empty states or help text.
- Use synthetic or fully anonymized data in mockups, demos, screenshots, and test fixtures.

### 10.5 Legal and institutional context

- Align with the Ley de Transparencia and the applicable data protection regulations.
- Legal review is required before defining retention, consent, and disclosure rules.
- Complaints and transparency requests remain in the existing municipal channels. The SPA does not replace them.
- ClaveÚnica is mentioned in the source in connection with online complaint channels, not as a staff authentication method. Do not assume it for internal login.

---

## 11. Responsive design and accessibility

### 11.1 Breakpoints

| Breakpoint | Width | Behavior |
| --- | --- | --- |
| Mobile | 320–767px | Single column, bottom sheets, card fallback for tables |
| Tablet | 768–1199px | Collapsible side panels, compact navigation |
| Desktop | 1200–1599px | Full application layout |
| Large desktop | 1600px+ | Wider workspace, constrained content |

### 11.2 Layout behavior

**Desktop:**

- Global navigation.
- Primary workspace.
- Inspector.

**Tablet:**

- Compact navigation.
- Primary workspace.
- Collapsible inspector or drawer.

**Mobile:**

- Brand and current section.
- Primary workspace.
- Inspector as a bottom sheet or full-screen detail.
- Primary action sticky at the bottom when appropriate.

Do not display a permanently fixed inspector that consumes most of the map or table area on mobile.

### 11.3 Field use

The source includes professional visits and transport coordination for construction materials. If mobile field use is confirmed, prioritize:

- Case lookup by RUT or folio.
- Scheduled visits.
- Evaluation form.
- Evidence capture, if the municipality uses photos or scanned documents.
- Delivery registration, when delivery is coordinated in the field.
- Signature registration.
- Contact attempt and reschedule.

Field screens need large tap targets, minimal typing, and a clear save state. Offline behavior is **to confirm**; if required, design explicit sync states, conflicts, and retry. Do not assume connectivity.

### 11.4 Accessibility

Target WCAG 2.2 AA.

- Visible focus indicators on every interactive element.
- Keyboard access to navigation, tabs, dialogs, tables, and map controls.
- Labels and descriptions for inputs; errors linked to fields.
- Sufficient contrast for text, status badges, and map labels.
- Do not rely on color alone for status, urgency, or map categories.
- Check category and territorial palettes for color-vision deficiency.
- Provide a table alternative for map data.
- Respect reduced motion.
- Support 200% zoom without loss of function.
- Use semantic headings and landmarks.
- Announce async results and errors to screen readers.
- Ensure dialogs trap focus and return it on close.

### 11.5 Print

- Delivery acts and reports need print styles.
- Use A4.
- Keep statuses legible in black and white; do not rely on color.
- Include the source, date, and confidentiality notice.
- Do not print hidden sensitive fields by accident.

---

## 12. Iconography and imagery

### 12.1 Icons

Recommended library: **Lucide**. Use consistent stroke-based icons, rendered inline at text size in the surrounding text color. Do not place icons in tinted containers or colored squares; iconography accompanies text, it does not decorate cards. Category color belongs only in data representations (bars, map markers, ledger edges), never in icon backgrounds.

| Property | Standard |
| --- | --- |
| Small icons | 14px |
| Standard icons | 16–18px |
| Large icons | 20–24px |
| Stroke width | 1.75–2px |
| Style | Outline |
| Color | Current text or semantic color |

Useful domain icons:

- `ClipboardList` — cases and evaluations.
- `HandCoins` — monetary aid.
- `Package` — stock and warehouse.
- `FileText` — documents.
- `Map` / `MapPin` — territory and address.
- `Truck` — construction materials and transport.
- `CalendarClock` — visits and rescheduling.
- `ShieldCheck` — confidentiality and permissions.
- `AlertTriangle` — blockers and stock alerts.

Do not mix filled icons, outlined icons, and unrelated icon families arbitrarily. Do not use an icon as the only indicator of a status.

### 12.2 Imagery

The system supports three types of imagery:

1. **Geographic imagery:** muted basemaps, territorial boundaries, and optional satellite layers.
2. **Evidence imagery:** photos of damage, documents, or delivery evidence, with a clear privacy reminder, role-based access, and consent where required.
3. **Document previews:** acts, reports, and administrative files.

Do not use decorative stock photography of families, disasters, or beneficiaries. Use initials-based avatars for people; do not use personal photos unless operationally required and authorized.

**Aspect ratios:**

- Evidence photos: 4:3.
- Document previews: A4 proportion.
- Map: fills the workspace.

All images need alt text. Decorative images use empty alt text.

---

## 13. Technical implementation

For a React SPA, separate design tokens, component primitives, domain components, and page-level compositions.

### 13.1 Project structure

Actual structure (Next.js App Router). Primitives live beside the pages that use them until a shared `ui/` package is justified; do not create abstraction layers ahead of need.

```text
app/
├── globals.css       Design tokens (:root) and panel styles
├── marketing.css     Landing and login styles
├── layout.tsx        Metadata and font setup
├── page.tsx          Landing (/)
├── login/
│   └── page.tsx      Expediente login (/login)
└── panel/
    ├── layout.tsx    Panel metadata
    └── page.tsx      Operations dashboard (/panel)

components/
├── interactive-territory-map.tsx  Leaflet map: tiles, choropleth polygons
├── landing-hero-map.tsx           Hero wrapper (map + territory caption)
├── login-form.tsx                 Institutional form (non-functional)
└── login-territories.tsx          Real-polygon backdrop for login

lib/
├── data.ts           Sectors, cases, alerts (synthetic operational data)
└── macrosectores.ts   GeoJSON loader, official-name join, centroids

public/
└── data/
    └── macrosectores.geojson  Vendored official boundaries (WGS84)
```

Future primitives from §6 (Table, Tabs, Accordion, Timeline) go in `components/ui/` when first needed, composed from these tokens — not before.

### 13.2 CSS design tokens

```css
:root {
  --color-primary: #3574b5;
  --color-primary-hover: #2e649e;
  --color-primary-active: #275687;
  --color-primary-deep: #060c66;
  --color-primary-medium: #4b9fd4;
  --color-primary-subtle: #eff7fd;
  --color-primary-light: #d9edfa;
  --color-focus: #3574b5;
  --color-focus-ring: rgba(53, 116, 181, 0.28);
  --gradient-logo: linear-gradient(
    90deg,
    #3574b5 0%,
    #4b9fd4 20%,
    #4db863 40%,
    #9ad34e 58%,
    #e8711f 80%,
    #e42d24 100%
  );

  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-secondary: #f5f8fb;
  --color-surface-dark: #0b1f3a;
  --color-surface-inverse: #0e1726;
  --color-border: #e1e8f0;
  --color-border-subtle: #eef3f8;
  --color-border-strong: #c9d5e2;

  --color-text-primary: #102133;
  --color-text-secondary: #5a6b7d;
  --color-text-muted: #8a99a9;
  --color-text-inverse: #ffffff;
  --color-sky: #a9d6f5;

  --color-success: #4db863;
  --color-success-strong: #2f7a45;
  --color-warning: #e8711f;
  --color-warning-strong: #a64a0a;
  --color-warning-bg: #fff4e6;
  --color-warning-border: #f7d3a7;
  --color-danger: #e42d24;
  --color-danger-strong: #b3261e;
  --color-danger-subtle: #fdecea;
  --color-info: #4b9fd4;
  --color-info-strong: #1d5e8c;

  --map-land: #e8eef4;
  --map-water: #bbddf5;
  --map-road: #f8fafc;
  --map-boundary: #9aa9b8;
  --map-label: #5a6b7d;

  /* Choropleth scale, low to high. Mirrored by territoryFill() in lib/data.ts. */
  --map-scale-1: #eff7fd;
  --map-scale-2: #c6e3f8;
  --map-scale-3: #93ccf1;
  --map-scale-4: #5aa6da;
  --map-scale-5: #3574b5;
  --map-scale-6: #1d4f7a;

  --font-family: var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --font-size-xs: 12px;
  --font-size-caption: 13px;
  --font-size-sm: 14px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 22px;
  --font-size-2xl: 30px;
  --font-size-display: clamp(40px, 4.6vw, 62px);
  --font-size-title: clamp(28px, 3.3vw, 40px);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 14px;
  --radius-3xl: 16px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 3px rgba(10, 25, 50, 0.08);
  --shadow-md: 0 4px 12px rgba(10, 25, 50, 0.1);
  --shadow-lg: 0 8px 24px rgba(10, 25, 50, 0.14);
  --shadow-panel: 0 4px 14px rgba(10, 25, 50, 0.07);

  --navbar-height: 64px;
  --inspector-width: 420px;
  --content-max-width: 1440px;
}
```


Avoid separate CSS implementations for visually identical buttons, cards, or tables across modules.

### 13.4 Workflow configuration

- Keep status vocabularies, required documents, and stock thresholds in configuration, not scattered across components.
- Do not encode unconfirmed municipal rules as hard-coded transitions.
- Make aid-specific sequences configurable.
- Use feature flags for modules that are pending validation.
- Record configuration changes in an audit log.

### 13.5 Security and privacy implementation

- Enforce authorization on the server for every case, document, export, and map layer.
- Treat UI masking as a usability measure, not a security control.
- Log access to sensitive documents and exports.
- Validate file types and sizes; scan uploads according to municipal policy.
- Avoid placing sensitive data in URLs, logs, or client-side analytics.
- Use secure session handling and role-aware API responses.
- Apply retention and deletion rules only after legal review.

### 13.6 Data and formatting

- Use `es-CL` for dates, numbers, and currency.
- Format RUTs consistently.
- Use tabular numerals for all numeric columns.
- Keep metric definitions in one shared module so “persona única” and “atención” mean the same thing across charts, tables, and exports.
- Record the data source and last update for imported or integrated data.

### 13.7 Performance and testing

**Performance:**

- Lazy-load the map and heavy chart libraries; keep the case workspace responsive.
- Paginate or virtualize large case and stock tables, especially given the high volumes mentioned in the source.

**Testing:**

- Visual regression for core components and page templates.
- Accessibility tests for keyboard, focus, contrast, and screen readers.
- Role-based tests for masking, permissions, and exports.
- Workflow tests for urgent delivery, regularization, monetary blockers, and rescheduling.
- Data tests for person-versus-attention counts and territory assignment.

---

## 14. Design consistency checklist

Use this checklist during implementation and code review.

**Progress:** 0/25 completed.

- [ ] All pages use the same global navigation and active-state treatment.
- [ ] Only token colors are used — no raw hex outside `:root`, no raw radii, no off-scale type outside the micro tier.
- [ ] Typography follows the defined scale, including Display, Title, and the metadata micro tier.
- [ ] Spacing follows the 4px system.
- [ ] Buttons use standardized variants and sizes.
- [ ] Inputs have consistent focus, error, and disabled states.
- [ ] Cards share the same border, radius, and padding conventions.
- [ ] Tables support sorting, filtering, loading, empty, and error states. (Future — §6.5.)
- [ ] Icons render inline at text size with no tinted containers.
- [ ] Statuses use outline stamps with text labels, never filled pills or color alone.
- [ ] No kicker pills above headings; arrows only on the single primary call to action per page.
- [ ] Side panels use standardized dimensions and behavior.
- [ ] Responsive layouts are defined for mobile, tablet, and desktop.
- [ ] Keyboard accessibility and visible focus indicators are supported.
- [ ] Map layers, legends, and category colors remain consistent.
- [ ] Map polygons come from the vendored official file; legend and `territoryFill()` agree.
- [ ] Map views default to aggregate territory; exact locations are restricted.
- [ ] RUTs and names are masked where full identity is not required.
- [ ] Territorial exports are anonymized by default.
- [ ] Person and attention counts are clearly distinguished.
- [ ] Pending regularization is visible and cannot be hidden by closure.
- [ ] No automatic aid assignment from an event type exists.
- [ ] No batch approval or batch delivery exists.
- [ ] Landing follows the hero/ledger/timeline patterns (§8.12); login follows the expediente pattern (§8.13).
- [ ] Unconfirmed rules are marked and configurable.

---

## 15. Final design specification

### System summary

**Municipal Aid & Emergency UI System** — design system specification for an internal municipal operations SPA.

| Element | Specification |
| --- | --- |
| Primary color | **Municipal Blue** `#3574B5` |
| Primary surface | **Neutral White** `#FFFFFF` |
| Accent palette | **Logo blue** `#4B9FD4` · **green** `#4DB863` · **lime** `#9AD34E` · **orange** `#E8711F` · **red** `#E42D24` · **navy** `#060C66` |
| Typography | **Inter** — Display/Title scale for heroes and sections, tabular numerals for operations |
| Language | **Spanish (Chile)** — `es-CL` |
| Iconography | **Lucide** — inline at text size, no containers |
| Spacing | **4px scale** — 4 / 8 / 12 / 16 / 24 / 32 |
| Radius | **7-step scale** — xs 4 / sm 6 / md 8 / lg 10 / xl 12 / 2xl 14 / 3xl 16 |
| Component style | **Floating surfaces** — white cards, subtle shadows, restrained borders |
| Workspace pattern | **Primary workspace + contextual inspector** |
| Primary map use | **Territorial analysis**, not individual case browsing |
| Default map data | **Official polygons** (vendored), choropleth by active cases |
| Interaction language | **Municipal blue** for selection and primary actions |
| Status language | **Outline stamps** with text; never color alone |
| Privacy default | **Masked, role-based, aggregate** |

**Design identity:**

A municipal operations interface with a consistent navigation shell, cool neutral information surfaces, municipal-blue interaction language, modular contextual panels, and predictable responsive behavior. The map anchors territorial analysis; the case workspace anchors daily work; documents and stock remain first-class operational modules.

**Principal recommendation:**

Treat the visual language as a reusable system, not a fixed page layout. The strongest pattern is the relationship between the dominant workspace and the contextual inspector. Preserve that relationship across the SPA, adapting the workspace to a case queue, a case detail, a map, a stock table, or a document queue as the task requires.

The design must also preserve two domain-specific qualities:

1. **Professional judgment is visible.** The interface supports the professional’s decision; it does not pretend to make it.
2. **Confidentiality is structural.** Individual data is protected by default, and territorial insight is delivered through aggregate views.

---

## Appendix A — Open questions and UI treatment

| Open question from the source | UI treatment |
| --- | --- |
| Required fields and exact registration procedure in each system | Mark required fields clearly; keep the required set configurable; validate before implementation. |
| Formal sequence of signatures, visations, and decree | Use a configurable document tracker with separate signature and visation states; show blockers. |
| How urgent deliveries are regularized afterward | “Pendiente de regularización” is a first-class state with a persistent queue and checklist. |
| Volume figures mentioned in the interview are referential; the source mentions high volumes but requires confirmation | Do not use them for sizing claims. Design tables with pagination and virtualization readiness. |
| Coverage and quality of territorial data | Show confidence, coverage, unassigned addresses, and manual override reasons. |
| Relationship between reports, the street master, and the municipal map | Use the street master for matching; record the source; do not assume automatic linkage. |
| Criteria and responsibilities for stock control, replenishment, and rescheduling | Keep thresholds and permissions configurable; record movements and reasons; confirm responsibilities. |
| Beneficiary online consultation | Out of scope. Do not add a public status portal without a separate validated process. |
| Complaints and transparency requests | Out of scope. Link to existing municipal channels. |
| Digital signature validity | Support registration and file upload; do not claim legal validity until confirmed. |

## Appendix B — Glossary

| Term | Meaning |
| --- | --- |
| **Atención / gestión** | A recorded interaction or service for a person. One person can have many. |
| **Ayuda** | A specific benefit delivered or authorized within a case. |
| **Caso** | The administrative file for a request or emergency. |
| **Comunidad rural** | A rural territorial unit that may represent the territory better than an urban-based unit. |
| **Decreto municipal** | The municipal instrument that authorizes an aid, as described in the source. |
| **Informe social** | The professional social report supporting the evaluation and aid. |
| **Acta de entrega** | The delivery record signed by the beneficiary or an authorized signer. |
| **Macrosector** | The primary territorial unit used by the municipality: 10 official polygons (see hierarchy), plus a rural operational entry without published geometry yet. |
| **Necesidad manifiesta** | The assessed need described by the professional after the visit. |
| **Regularización** | The later completion of paperwork after an urgent material delivery. |
| **Rendición** | The municipal accountability report for aids and expenses. Its official format and approval flow are to confirm. |
| **Unidad vecinal** | A smaller territorial unit: 32 urban + 4 rural, as mentioned in the source. |
| **Visación** | The review and approval of a document by a responsible official, distinct from a beneficiary signature. |
