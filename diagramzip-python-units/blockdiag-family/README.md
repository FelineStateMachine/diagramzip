# BlockDiag family renderer

One Cloudflare Python Worker renders BlockDiag, SeqDiag, ActDiag, NwDiag,
PacketDiag, and RackDiag directly from pinned upstream Python libraries. The
request hostname selects the engine. Request bodies cannot select a different
engine.

The Worker imports renderer libraries directly and does not execute a command,
spawn a process, call Java, or fetch the Fly compatibility origin. Remote and
filesystem-backed images are rejected. SVG is sanitized before presentation
metadata, padding, backgrounds, and framing are applied.

The six engines share one Worker because they are one compatible upstream
dependency family: the four source trees provide the same parser/builder,
SVG drawer, font, and node-renderer model.  They retain six hostnames so the
hostname remains the only engine selector; sharing the deployment avoids six
copies of Pillow, the font, and the registration table without allowing one
request to select another engine.

## Reproduce locally

Run these commands from this directory:

```sh
uv sync
uv run pytest -q
uv run pywrangler sync
uv run pywrangler dev --port 8788
```

The Worker build is Pyodide-based. `pywrangler sync` is therefore the
important packaging check; ordinary `uv sync` only checks the CPython test
environment. Deploy only after both checks pass:

```sh
uv run pywrangler deploy
```

For a local request, route the hostname to the development port, for example:

```sh
curl --resolve blockdiag.render.diagram.zip:8788:127.0.0.1 \
  -H 'Content-Type: application/json' \
  --data '{"source":"blockdiag { a -> b; }"}' \
  http://blockdiag.render.diagram.zip:8788/v1/svg
```

The request body must not contain an `engine` field. Wrangler's local custom
domain emulation currently resolves every configured hostname as the first
route, so use the CPython six-engine fixture suite locally and smoke all six
real hostnames after deployment. Do not treat a local `Host` header as proof
of per-host dispatch.

## Parity and Java reference procedure

The legacy Kroki image is a reference only. Run it through Docker. Do not
install Java or run Maven on the host:

```sh
docker run --rm -p 8000:8000 yuzutech/kroki:0.32.1
```

Send the same fixtures to the Docker reference and to the Worker development
port, then compare structural SVG coverage and record engine-specific losses.
Pixel equality is not a gate for this extraction. The repository's broader
Docker smoke stack is available with:

```sh
docker compose -f ../../ci/tests/docker-compose.yaml up --abort-on-container-exit
```

Pinned upstream revisions and their licenses are recorded in
`THIRD_PARTY_NOTICES.md` and `uv.lock`.

## Boundaries and known losses

The request protocol enforces a 1 MiB body limit, a 512 KiB source limit, at
most 64 options (4 KiB per option), padding from 0 through 256, and a 4 MiB
sanitized SVG limit. Only SVG output is exposed. Remote URLs and filesystem
images are rejected before they can be fetched. Returned SVG is parsed with
`defusedxml`; scripts, event handlers, active elements, external references,
unsafe CSS, and unsafe embedded resources are removed.

Supported renderer options currently include `size=WIDTHxHEIGHT`, `antialias`,
`no-transparency`, and `no-doctype`. The two raster-only flags, `antialias` and
`no-transparency`, intentionally have no effect on SVG. Other upstream
command-line options are validated by the common protocol but are not silently
passed to a CLI: they are documented loss until a direct API mapping is added.
The Worker uses the same bundled DejaVu Serif font path as the Docker reference
for deterministic text metrics; font fallback can still differ from a larger
host installation.

The vendored runtime replaces upstream `importlib.metadata` entry-point
discovery with an explicit registration table. It installs the SVG drawer,
all bundled node renderers (including PacketDiag), and only the built-in
`attributes`, `autoclass`, and `autolane` plugins. This keeps the Worker
reproducible and prevents arbitrary installed plugins from entering the
rendering process.

The upstream libraries expose process-wide mutable renderer and plugin
registries. Registration is one-time startup work; each render and its cleanup
are synchronous with no `await` boundary, so requests cannot interleave while
those registries are mutated inside one isolate. Cloudflare may run multiple
isolates, each with its own Python runtime and registries. Keep rendering
synchronous unless the registries are first made request-local.
