# Monaco Editor migration specification

Status: Implemented in this worktree; real-device mobile validation pending

Scope: `diagramzip` web application

Branch: `codex/monaco-editor-spec`

## Summary

Replace the CodeMirror 6 source editor with Monaco Editor while preserving the
existing diagram state, draft, preview, save, share, and type-switching
behaviour.

This should not ship as an unconditional component swap. Monaco explicitly does
not support mobile browsers, while diagram.zip has a deliberate mobile editor
flow. The recommended release shape is:

- Monaco on supported desktop browsers.
- A small native `<textarea>` editor on touch-only/mobile browsers, loaded
  without Monaco.
- A release gate requiring real-device mobile checks and explicit product
  acceptance of the reduced mobile editing experience.

If syntax highlighting and code-editor features must remain first-class on
mobile, the recommendation is to keep CodeMirror rather than perform this
migration. Shipping both Monaco and CodeMirror indefinitely is not recommended;
it doubles the editor integration surface and weakens the dependency-removal
benefit.

## Motivation

Monaco provides a richer desktop editing platform for future diagnostics,
completion, formatting, and language-aware actions. The migration should first
establish behavioural parity and a maintainable editor boundary. Language
servers, renderer-aware completion, and schema-driven validation are follow-up
features, not reasons to broaden the initial change.

## Current implementation

CodeMirror is coupled to the application in three places:

1. `apps/editor/src/main.js` creates `EditorView`, reads the document in
   `currentState()`, listens for edits, and replaces the document and language
   in `applyState()`.
2. `apps/editor/src/diagram-types.js` imports CodeMirror language packages and
   returns editor-specific language extensions.
3. `apps/editor/src/style.css` targets `.cm-*` selectors.

The important behavioural contract is small:

- `currentState()` must synchronously read the complete source.
- User edits schedule `commitState()` after 1.2 seconds.
- Programmatic document replacement must not schedule an intermediate commit.
- Changing diagram type replaces both source and syntax mode while preserving
  per-type drafts.
- Save, restore, copy, remote-load, locked-diagram, and preview flows all call
  through the same state functions.
- The editor fills its grid panel at desktop and mobile sizes.
- Command/Ctrl+S saves instead of invoking the browser action.

The current production build is approximately 618 kB of JavaScript raw and
195 kB gzip. This is the baseline for evaluating Monaco's cost; it is not a
budget that Monaco is expected to match.

## Goals

- Preserve all source/state semantics and the 1.2-second preview debounce.
- Preserve undo/redo, find, line numbers, selection, bracket matching, syntax
  colouring, keyboard editing, and clipboard behaviour on desktop.
- Keep editor-specific APIs out of application state and diagram catalog code.
- Use Monaco's ESM build and Vite-generated module workers under the existing
  `/diagram.zip/` base path.
- Load only the editor features, languages, and workers diagram.zip uses.
- Keep source usable if local storage, rendering, or remote persistence fails.
- Provide a functional mobile fallback when Monaco is not selected.
- Remove CodeMirror packages after the fallback decision is accepted.

## Non-goals

- VS Code extension compatibility.
- A language server or custom completion service.
- Renderer-backed validation or formatting.
- Per-diagram-type semantic grammars for all 30 renderers.
- Multiple open files, tabs, diff views, or a command palette.
- Dark mode; the application currently defers it across editor and renderers.
- Persisting cursor, selection, fold, scroll, or undo history across reloads.
- Preserving undo history when an external state or diagram-type draft replaces
  the entire document. This matches the conceptual boundary between drafts.

## Proposed design

### 1. Introduce an editor-neutral contract

Add `apps/editor/src/source-editor.js` as the only module imported by
`main.js`. It owns backend selection and exposes this interface:

```js
const sourceEditor = await createSourceEditor({
  element,
  source,
  diagramType,
  onChange,
  onSave,
})

sourceEditor.getValue()
sourceEditor.setDocument({ source, diagramType })
sourceEditor.focus()
sourceEditor.layout()
sourceEditor.dispose()
```

`setDocument()` is atomic from the application's perspective: it suppresses
backend change notifications, replaces the value, changes the language, then
re-enables notifications. Use a nesting counter with `try/finally`, not a bare
boolean, so an exception cannot leave notifications disabled.

`main.js` changes only at these seams:

- Await editor creation after initial state has loaded.
- Replace `editor.state.doc.toString()` with `sourceEditor.getValue()`.
- Replace the CodeMirror dispatch in `applyState()` with
  `sourceEditor.setDocument()`.
- Route save keyboard handling through the `onSave` callback while retaining
  the window-level shortcut for focus outside the editor. The focused Monaco
  path must stop or de-duplicate propagation so a single shortcut produces one
  save attempt.

Move editor language selection out of `diagram-types.js`. That module should
remain a pure diagram catalog/query-string module and be testable without a DOM
or Monaco.

### 2. Monaco backend

Add `apps/editor/src/editors/monaco-editor.js` and
`apps/editor/src/editors/monaco-languages.js`.

Use Monaco 0.56.x (0.56.0 is current at the time of this spec) through its ESM
API. The lockfile remains the source of truth for the exact version. Do not use
the deprecated AMD build or a third-party Monaco Vite plugin.

Use one `ITextModel` and one standalone editor. A single model matches the
current application, where only one diagram draft is active at a time. On
external replacement:

1. Enter notification suppression.
2. Call `model.setValue(source)`.
3. Call `monaco.editor.setModelLanguage(model, languageId)`.
4. Clamp the cursor to the new document and reveal it.
5. Exit suppression.

Dispose the content-change subscription, editor, and model together. This is
required for development hot reload and tests even though the production page
normally owns one editor for its lifetime.

Recommended editor options:

```js
{
  ariaLabel: 'Diagram source editor',
  automaticLayout: true,
  contextmenu: true,
  folding: true,
  fontFamily: resolvedMonospaceFont,
  fontSize: 14,
  glyphMargin: false,
  lineHeight: 23,
  lineNumbers: 'on',
  minimap: { enabled: false },
  overviewRulerBorder: false,
  padding: { top: 28, bottom: 80 },
  renderLineHighlight: 'all',
  scrollBeyondLastLine: false,
  stickyScroll: { enabled: false },
  wordWrap: 'off',
}
```

The Monaco minimap stays off because the adjacent preview already has a
diagram minimap. Resolve `--font-mono` to a concrete computed value before
passing it to Monaco so font measurement does not depend on Monaco resolving a
CSS custom property.

Define a `diagramzip` theme from the existing CSS colour variables. Keep the
source of truth in CSS, read the resolved colours at startup, and pass concrete
colour values to `monaco.editor.defineTheme()`. Do not hard-code a second visual
palette in JavaScript.

### 3. Workers and Vite

Import workers through Monaco 0.56's public ESM export paths with Vite's
`?worker` form and set
`self.MonacoEnvironment.getWorker` before creating the editor:

- `monaco-editor/editor/editor.worker.js?worker` for the editor.
- `monaco-editor/language/json/json.worker.js?worker` for strict JSON.

Return the JSON worker only for the `json` label and the editor worker for all
other labels. CSS, HTML, and TypeScript workers are out of scope. The production
build must emit hashed, same-origin worker assets whose URLs include the Vite
base path; there must be no root-relative `/assets/...` assumption.

The browser console warning that Monaco could not create workers is a release
failure. Do not accept Monaco's main-thread fallback because it can cause input
jank and hides deployment errors.

### 4. Language mapping

Register only the languages needed for parity. Prefer Monaco's basic-language
ESM contributions and a custom Monarch tokenizer for the generic diagram
language. Do not import Monaco's aggregate language bundle.

| Diagram types | Monaco language | Notes |
| --- | --- | --- |
| `excalidraw`, `vega`, `vegalite` | `json` | Strict JSON; use the JSON worker. Do not add renderer schemas in this change. |
| `wavedrom` | custom `json5` | The renderer accepts JSON5; strict JSON diagnostics would be incorrect. |
| `bpmn`, `diagramsnet`, `umlet` | `xml` | Syntax tokenization only. |
| `wireviz` | `yaml` | Syntax tokenization only. |
| `dbml` | `sql` | Preserves the current approximate highlighting. |
| `bytefield` | `clojure` | Corrects the current JSON misclassification; bytefield source is Clojure forms. |
| all remaining types | custom `diagram-source` | Port the existing comment, string, number, colour, operator, directive, and keyword rules to Monarch. |

The generic language must preserve these current cases:

- Block comments delimited by `/*` and `*/`.
- Line comments beginning with `%%`, `//`, `'`, or `#` after indentation.
- PlantUML-style `@start*` and `@end*` directives.
- Quoted strings with escapes.
- Diagram arrow/operator forms.
- Hex colours, numbers, known keywords, and identifiers.

Add bracket and comment configuration only where it is correct across the
generic group. Do not add aggressive auto-closing rules that can corrupt ASCII
diagram formats such as Ditaa, GoAT, and Svgbob.

### 5. Mobile fallback

Add `apps/editor/src/editors/textarea-editor.js` implementing the same contract.
It provides plain text editing, selection, undo/redo supplied by the browser,
the save shortcut, full-document replacement, and change notifications. It does
not provide line numbers, syntax highlighting, folding, or find beyond the
browser's capabilities.

Backend selection happens once at page startup. The initial policy is:

- Use the textarea on touch-only devices whose primary pointer is coarse.
- Use Monaco elsewhere.
- Allow `?editor=textarea` as a temporary diagnostic escape hatch during the
  rollout. Do not persist it into saved or shared diagram state.

Input-media detection is only a routing heuristic, not a claim that Monaco is
supported on every selected device. Test the target browser matrix below. Do
not hot-swap backends on resize or device rotation; doing so would complicate
focus and undo semantics.

If product does not accept the reduced mobile feature set, stop the migration
and retain CodeMirror.

### 6. Styling and layout

- Replace `.cm-*` rules with the minimum `.monaco-editor` and textarea fallback
  rules.
- Keep `#editor`, `.editor-panel`, and the grid structure unchanged.
- Monaco must be laid out after the editor panel becomes visible. Call
  `sourceEditor.layout()` when switching the mobile tab back to Edit, even with
  `automaticLayout` enabled.
- Preserve the current surface, gutter, active-line, selection, cursor, font,
  and syntax colour intent.
- Verify that Monaco's find and suggestion widgets are not clipped by
  `.editor-panel { overflow: hidden; }`.

## Dependency changes

Expected file-level change set:

| File | Change |
| --- | --- |
| `package.json`, `package-lock.json` | Add Monaco and remove CodeMirror dependencies. |
| `apps/editor/src/main.js` | Consume the editor-neutral contract; remove CodeMirror imports and direct APIs. |
| `apps/editor/src/diagram-types.js` | Remove editor imports and `languageFor()`. |
| `apps/editor/src/source-editor.js` | Select and expose a backend through one contract. |
| `apps/editor/src/editors/monaco-editor.js` | Create, configure, update, and dispose Monaco. |
| `apps/editor/src/editors/monaco-languages.js` | Register narrow language contributions, JSON5, and the generic Monarch grammar. |
| `apps/editor/src/editors/monaco-workers.js` | Configure the editor and JSON worker constructors. |
| `apps/editor/src/editors/textarea-editor.js` | Implement the mobile/support fallback. |
| `apps/editor/src/style.css` | Replace CodeMirror selectors and style the fallback. |
| `apps/editor/test/*` | Add language routing and editor contract coverage. |

`apps/editor/vite.config.js` should not need a Monaco plugin. A config change is
justified only if production worker/base-path testing demonstrates a problem
that Vite's standard worker imports cannot solve.

Add:

- `monaco-editor` 0.56.x.
- An npm override to DOMPurify 3.4.14 or newer while Monaco pins an older
  vulnerable patch. Keep the override until Monaco's direct dependency is
  updated, and verify it with `npm audit` during upgrades.

Remove after the mobile decision is accepted and the new backends pass tests:

- `codemirror`
- `@codemirror/lang-json`
- `@codemirror/lang-sql`
- `@codemirror/lang-xml`
- `@codemirror/lang-yaml`
- `@codemirror/language`
- `@lezer/highlight`

Run `npm install` rather than hand-editing `package-lock.json`.

## Loading and performance requirements

Monaco's npm package is about 98 MB unpacked, so aggregate imports can create a
large accidental payload. The implementation must:

- Dynamically import the Monaco backend only after choosing it, keeping the
  mobile fallback free of Monaco code.
- Use ESM editor API and specific language contributions.
- Emit only the editor and JSON workers.
- Record raw and gzip sizes for entry JavaScript, Monaco chunks, CSS, and each
  worker before and after the change.

Release thresholds:

- No individual initial JavaScript resource larger than 1 MB gzip.
- No more than 1.5 MB gzip total JavaScript for opening the default desktop
  editor and then switching once to a strict JSON type, including both workers.
- No Monaco JavaScript or worker request on the textarea path.
- Typing, paste, type switching, and preview scheduling show no visible
  main-thread stall in the supported desktop matrix.

These are guardrails, not targets. Report the actual delta in the implementation
PR so reviewers can decide whether the desktop feature gain justifies it.

## Accessibility requirements

- The editable control has the accessible name `Diagram source editor`.
- Screen-reader mode remains automatic.
- Keyboard-only users can reach the editor, edit, invoke find, save, and leave
  the editor. Document Monaco's Tab trapping shortcut in a discoverable help
  affordance if testing shows users cannot find it.
- Focus indicators remain visible in forced-colours/high-contrast modes.
- Browser zoom at 200% does not hide the editor or critical controls.
- The textarea fallback keeps the section label and visible focus treatment.

## Testing plan

### Unit tests

Add backend-independent contract tests for both implementations where a DOM is
available, plus pure tests for language routing:

- `getValue()` returns initial and edited source exactly, including Unicode and
  trailing newlines.
- One user edit produces one application change notification.
- `setDocument()` produces no application change notification.
- `setDocument()` changes both value and language.
- A thrown backend operation does not leave change notifications suppressed.
- Save callback fires for Command+S and Ctrl+S.
- All 30 diagram types resolve to a registered language.
- WaveDrom routes to JSON5, and bytefield routes to Clojure.

Keep existing state, type-draft, persistence, encryption, and renderer tests
unchanged. Passing them is evidence that the editor boundary did not leak into
application state.

### Build and asset tests

- `npm run test:editor`
- `npm run build:editor`
- Inspect emitted HTML, chunks, and worker URLs under the production
  `/diagram.zip/` base.
- Assert the production assets contain no CodeMirror packages.
- Assert only the expected Monaco language contributions and workers are
  emitted.
- Serve the built output over HTTP; `file://` is not a valid worker test.

### Browser acceptance matrix

Desktop, supported path:

- Current Chrome on macOS and Windows.
- Current Firefox on macOS or Windows.
- Current Safari on macOS.
- Current Edge on Windows.

Mobile/fallback path:

- Safari on a current iPhone.
- Chrome on a current Android phone.
- At least one iPad/tablet with touch input and, if available, a hardware
  keyboard.

For every browser, verify:

1. Open a new diagram and edit source.
2. Confirm one preview request after the debounce.
3. Switch among a generic, JSON, XML, YAML, SQL, JSON5, and bytefield type.
4. Switch back and confirm per-type draft restoration.
5. Save, reload, restore saved state, make a copy, and open a shared edit link.
6. Exercise undo/redo, find, select all, copy/paste, and Unicode input.
7. Change between Edit and Preview mobile tabs and rotate/resize the viewport.
8. Confirm no worker failure, uncaught exception, or unexpected main-thread
   fallback in the console.

## Rollout

Implement in reviewable stages on one branch:

1. Add the source-editor contract and textarea backend without changing the
   default CodeMirror path.
2. Add Monaco, language registration, theme, and workers behind a local query
   switch.
3. Complete automated and real-device acceptance testing and capture bundle
   measurements.
4. Make backend selection default to Monaco desktop/textarea mobile.
5. Remove CodeMirror code and dependencies.
6. Keep `?editor=textarea` for one release as a support escape hatch, then
   decide whether to retain or remove it based on issue reports.

No server, persistence API, encryption format, shared URL, or stored draft
migration is required. Source remains a string and editor choice is local UI
state.

## Acceptance criteria

The migration is complete when:

- Every current diagram flow reads and writes identical source strings.
- Existing diagramzip tests pass without weakening assertions.
- New editor contract and language-routing tests pass.
- Production workers load under `/diagram.zip/` with no console fallback.
- Desktop keyboard, accessibility, and browser checks pass.
- The mobile fallback passes the phone/tablet matrix and product accepts its
  reduced feature set.
- Bundle measurements satisfy the guardrails and are recorded in the PR.
- CodeMirror runtime code, CSS, direct dependencies, and lockfile entries are
  gone.
- The implementation PR documents any deliberate difference from this spec.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Monaco is unsupported on mobile | Broken input or navigation for current mobile users | Route touch-only/mobile users to textarea; require real-device gate; retain CodeMirror if parity is mandatory. |
| Bundle growth | Slower first edit, especially on constrained networks | Dynamic desktop import, narrow ESM imports, two workers only, measured thresholds. |
| Worker URL/base-path error | Console warnings and main-thread work | Use Vite worker imports, test production base path over HTTP, fail release on fallback warning. |
| Programmatic changes look like user edits | Extra renders, dirty-state churn | Atomic `setDocument()` with counter-based notification suppression and tests. |
| JSON validation rejects JSON5 | False errors for WaveDrom | Separate `json5` language without strict JSON diagnostics. |
| Generic auto-closing changes ASCII source | Corrupted Ditaa/GoAT/Svgbob editing | Conservative language configuration and fixture-based manual checks. |
| Theme mismatch or clipped widgets | Visual regression | Resolve CSS tokens into a Monaco theme and inspect find/hover widgets at responsive sizes. |
| Accidental aggregate imports | Unnecessary languages and workers in production | Import only explicit ESM contributions and inspect build assets. |

## Decision gates

Before implementation is merged, reviewers must answer:

1. Is a plain-text mobile editor acceptable? If no, this proposal is a no-go
   and CodeMirror should remain.
2. Does the measured desktop payload fit the product's performance posture?
3. Are JSON diagnostics desired for strict JSON formats, or should validation
   remain entirely renderer-driven? The default in this spec is syntax plus
   built-in JSON diagnostics, without external schemas.

## References

- [Monaco Editor repository and FAQ](https://github.com/microsoft/monaco-editor)
- [Official ESM and Vite integration guide](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/typedoc/)
- [Monaco accessibility guide](https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide)
