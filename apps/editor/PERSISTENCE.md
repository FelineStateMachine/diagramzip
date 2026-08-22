# diagram.zip persistence

Status: implemented end to end. The editor, Worker API, D1/R2 model, browser
encryption, stable render URLs, and conflict/fork/share flows have automated
coverage. Production deployment uses the repository release workflow.

## Product contract

diagram.zip does not require accounts. Drafts remain local until the user
chooses Publish or Encrypt & Publish. Save as File exports an editable enriched
SVG without creating an alias. Possession is the access model for aliases:

| Diagram | Read | Write |
| --- | --- | --- |
| Open | Alias URL | Alias URL plus write capability |
| Locked | Alias URL plus password | Alias URL plus password and write capability |

There are no owners, users, sessions, ACLs, or recovery flows. Losing a write
capability means losing the ability to update that alias. Losing a password
means losing the ability to decrypt a locked diagram.

Editable SVG files remain visible images and carry a versioned Diagram.zip
document in metadata and `data-*` attributes. The importer accepts local files,
drag and drop, pasted SVG, and HTTP(S) or data URLs. It rejects ordinary,
ambiguous, unsupported, or lossy SVG instead of guessing, and limits input to
5 MiB. File exports are plaintext and are not encrypted backups.

Read links are short and stable:

```text
https://diagram.zip/d/{alias_id}
```

An edit link adds the capability in the URL fragment so browsers do not send it
in an HTTP request:

```text
https://diagram.zip/d/{alias_id}#w={write_capability}
```

The app imports that capability into local storage under the alias ID and
immediately removes the fragment from the address bar. Copying the normal page
URL therefore copies a read link, not an edit link.

The existing self-contained diagram hash format is not part of the new public
contract and does not need a compatibility path.

Anonymous SVG and Markdown embeds use a separate self-contained URL:

```text
https://diagram.zip/svg/{compressed_editable_svg}
```

The URL contains the rendered SVG and its editable Diagram.zip document. It is
immutable, creates no alias, and writes nothing to D1 or R2. The shell inflates
the bounded payload, revalidates and sanitizes the enriched SVG, and returns it
with an SVG content type and restrictive CSP. Oversized URLs fail closed and
the UI directs the user to Save as File or Publish.

## Identifiers and capabilities

- `alias_id`: 12 cryptographically random bytes encoded as unpadded Base64URL,
  exactly 16 characters. It is public and optimized for short links.
- `content_id`: SHA-256 of the canonical stored content bytes, encoded as
  unpadded Base64URL, exactly 43 characters. It is internal and immutable.
- `render_id`: SHA-256 of the render-affecting content and metadata, encoded the
  same way. It excludes the password key envelope, so changing only a password
  does not invalidate unchanged renders.
- `write_capability`: 32 cryptographically random bytes encoded as unpadded
  Base64URL, exactly 43 characters. The browser generates it. The API receives
  it only as a Bearer credential and D1 stores only its SHA-256 digest.

The alias ID is deliberately not authorization. The 256-bit write capability
is.

## Storage ownership

Cloudflare D1 owns small, mutable records:

- the alias-to-content pointer;
- the server-owned revision used for compare-and-swap updates;
- plaintext metadata for open aliases or encrypted metadata for locked aliases;
- the write-capability digest;
- the locked-diagram key envelope.

Cloudflare R2 owns immutable bytes:

```text
contents/open/{content_id}.json
contents/locked/{content_id}.enc
renders/open/{renderer_unit}/{renderer_build}/{render_id}.svg
renders/open/{renderer_unit}/{renderer_build}/{render_id}.png
renders/locked/{renderer_unit}/{renderer_build}/{render_id}.svg.enc
renders/locked/{renderer_unit}/{renderer_build}/{render_id}.png.enc
render-heads/open/{render_id}.{svg|png}.json
render-heads/locked/{render_id}.{svg|png}.json
```

Each small render-head manifest records the owning unit, exact build, explicit
translation pipeline, and immutable object key. R2 object existence is the
render-cache source of truth; there is no D1 row per render. Draft previews
remain transient and use the current renderer. Only an explicit Publish or
Encrypt & Publish action writes immutable content and advances an alias.

The schema is executable in
`services/api/migrations/0001_aliases.sql`. Open content contains `type`,
`source`, `options`, and presentation settings. Alias metadata contains `title`
and `description`, so metadata can change without manufacturing a new content
ID.

## Persistence API

The persistence Worker uses the same-origin `/api/v1/*` route. The editor sends
each transient render to the selected engine subdomain. An HTTP engine uses
`https://{engine}.render.diagram.zip/v1/svg`. A client engine uses its sandboxed
renderer frame. No transient render uses the Fly.io application or a shared
render proxy.

### Create

```http
POST /api/v1/aliases
Authorization: Bearer {write_capability}
Content-Type: application/json

{
  "mode": "open",
  "diagram": {
    "type": "d2",
    "source": "a -> b",
    "options": {},
    "presentation": { "background": "", "padding": 0, "frame": false, "appearance": "raw" }
  },
  "metadata": { "title": "A to B", "description": "" }
}
```

The response is `201 Created`, includes `Location`, and uses `ETag: "1"`.
The capability is never returned by the API.

### Read

```http
GET /api/v1/aliases/{alias_id}
```

Open reads are public and return the assembled alias, metadata, and diagram.
The revision is also returned as a strong `ETag`.

### Update

```http
PUT /api/v1/aliases/{alias_id}
Authorization: Bearer {write_capability}
If-Match: "{revision}"
Content-Type: application/json
```

The API hashes and compares the fixed-size capability digest, writes the
immutable content object, inserts its content row, and conditionally advances
the alias. A stale revision returns `412 Precondition Failed`; a missing
precondition returns `428 Precondition Required`.

R2 and D1 cannot share a transaction. Writes therefore happen in the safe
direction: immutable R2 object, D1 content row, alias pointer. Failure can leave
an unreferenced object, but never an alias that points at missing content.
Orphans can be collected later with a grace period.

### Durable renders

After a successful publish, the browser stores one canonical safe SVG and, where
the browser can rasterize it, a PNG:

```http
PUT /api/v1/aliases/{alias_id}/renders/{svg|png}
Authorization: Bearer {write_capability}
If-Match: "{revision}"
X-Render-Id: {render_id}
X-Renderer-Unit: vegalite
X-Renderer-Build: vegalite-6.4.3-vega-6.3.1-unit-1
X-Renderer-Pipeline: vegalite,vega
```

The SVG upload must use the current Diagram.zip canonical schema. The API
validates and deterministically serializes it before R2 accepts it. The
revision and render ID prevent a slow render from being attached after the
alias has changed. Open bytes use their image media type. Locked bytes are
AES-GCM ciphertext encoded as JSON. Open embeds use the stable URL
`/api/v1/aliases/{alias_id}/renders/svg`; locked aliases return a clear 403 from
that route. An unlocked browser can fetch opaque bytes with `?encrypted=1` and
decrypt them with the same in-memory bundle key.

An open SVG read may add an `appearance` query parameter:

```text
/api/v1/aliases/{alias_id}/renders/svg?appearance=auto-framed
```

The API materializes the requested appearance from the canonical R2 object. It
does not store a second SVG. The appearance has its own ETag. Locked renders
cannot use this server-side path because the API cannot decrypt their SVG.

The published presentation records the selected appearance. The editor places
the same appearance on stable SVG and Markdown links. `raw` uses the renderer
canvas controls. A shared appearance ignores those legacy controls and
materializes its own palette and, for framed appearances, its own canvas.

An anonymous draft instead exports the current deterministic editable SVG and
packs those bytes into `/svg/{compressed_editable_svg}`. This path does not
proxy a render request and supports both HTTP and client renderer outputs.

## Editor and share UX

Open drafts continue to autosave locally and render after the existing debounce.
They do not write to D1 or R2. Locked drafts are deliberately not written to
local storage as plaintext; they persist only when the user explicitly
publishes.

The root route is a local-first launcher. Its recent index stores metadata only;
local document bodies use separate keys and published aliases are refetched.
Changing format preserves the parked per-format drafts inside the local document
body. The legacy single anonymous draft is migrated into this model on first
boot.

The left pane separates diagram Source from schema-validated Details JSON.
Details owns title, description, and presentation values. Invalid Details text
remains recoverable while file export, publishing, sharing, privacy, and type
changes stay blocked.

- New draft: **Save as File** downloads an editable SVG and creates no alias.
- New draft: **Copy SVG URL** and **Copy as Markdown** use a packed editable SVG
  URL and create no alias.
- New draft: **Publish** creates an alias and changes the browser to its read URL.
- Writable alias: **Publish** updates with the last revision.
- Local document: the launcher can reopen, duplicate, or explicitly delete it.
- Read-only alias: edits form a local fork; **Publish a Copy** creates a new alias.
- Conflict: offer **Reload published** or **Publish as new**. Never overwrite silently.
- Share, open: copy read link, copy edit link, SVG link, or Markdown.
- Share, locked: copy password-required read link or password-and-capability edit
  link. SVG and Markdown embeds are visibly disabled with the explanation that
  encrypted diagrams cannot be embedded.

The compact header keeps title, local-change state, render status, and a format
button. The format button or **Command-K / Control-K** opens the command palette.
The palette owns format changes, file export, publishing, copy/share actions,
view commands, open, new, and documentation. **Command-S / Control-S** always
means Save as File; publishing remains an explicit command.

The password and edit capability should be sent through separate channels when
practical. The edit link itself is a bearer credential and the UI must label it
that way.

## Locked diagrams

The password-lock interaction follows the useful shape demonstrated by
[textarea PR #40](https://github.com/antonmedv/textarea/pull/40): a native
password dialog, confirmation when locking, and retry on decryption failure.
Its URL-contained ciphertext format is not reused.

Instead, the browser generates a random 256-bit bundle key. Source, metadata,
and persisted SVG/PNG bytes are encrypted with AES-256-GCM using a unique random
96-bit IV for every object. A password-derived key wraps the bundle key, so a
password change rewrites only the key envelope rather than every object.

The versioned envelope records the KDF algorithm, salt, and work parameters so
the KDF can be strengthened without a storage migration. The current native Web
Crypto implementation uses PBKDF2-HMAC-SHA-256 with a random 128-bit salt and
600,000 iterations. Passwords and unwrapped bundle keys never leave the browser
and are not written to local storage. The renderer may receive plaintext
transiently to produce an image, but durable storage receives only ciphertext.

## Abuse and operational boundaries

- No alias listing, search, or public content-upload endpoint.
- Strict identifier grammar, JSON media type, a one MiB alias request ceiling,
  and a 12 MiB render ceiling.
- Rate limiting belongs on the same-origin Worker route before broad launch.
- Logs must not include `Authorization`, request bodies, passwords, key
  envelopes, or fragments.
- Render keys include the owning unit and renderer-build identifier, while the
  render-head records translated pipelines, so upgrades never serve stale
  output under a current key.
- Direct R2 public access remains disabled; reads go through controlled routes.
