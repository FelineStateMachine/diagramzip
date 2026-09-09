---
id: block-transform
title: Block transform
description: Render fenced diagram blocks from Nostr events into static SVG artifacts through the diagram.zip transform endpoint.
sidebar_position: 1
---

# Block transform

tinyrelay is a self-hosted Nostr relay with custom views. A view POSTs the
fenced snippets of a source event to a transform URL and stores the answer as
static artifacts attached to that event. Diagram.zip provides the block
transform at this endpoint:

```text
POST https://diagram.zip/transform/blocks
```

The former `/transform/tiny` route remains available for tinyrelay clients.
It uses the legacy `X-Tiny-Signature` header and `TINY_TRANSFORM_SECRET`
binding. New integrations should use the generic route and names below.

The relay sends fenced code blocks. The endpoint maps each block language to a
renderer and renders the blocks in parallel. It materializes the SVG in the
requested appearance and returns one artifact per successful block. This is a server to
server call. The endpoint does not send CORS headers and browsers cannot call
it directly.

## Request

Send a JSON body with the fenced blocks the relay found in the event content.
The body identifies the source event but never carries it:

```json
{
  "relay": "https://relay.example",
  "view": "diagrams",
  "appearance": "auto-transparent",
  "source": { "id": "<hex>", "kind": 30818 },
  "blocks": [
    { "index": 0, "lang": "mermaid", "source": "graph TD; a-->b" },
    { "index": 1, "lang": "python", "source": "print(1)" }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `relay` | The relay origin. Informational. |
| `view` | The view name. Informational. |
| `appearance` | Optional. One of the seven SVG appearances. The default is `auto-transparent`. |
| `source` | Optional. The id and kind of the source event, kept as metadata. The endpoint reads nothing else from it. |
| `blocks[].index` | The block position in the event content. It is echoed back on each artifact. |
| `blocks[].lang` | The fence language. Blocks whose language is not a renderer are skipped. |
| `blocks[].source` | The diagram source. |

A body that includes an `event` field is rejected with `400`. The endpoint
never receives event content, and this rule keeps that boundary visible.

Send these headers with the request:

| Header | Value |
| --- | --- |
| `Content-Type` | `application/json` |
| `X-Transform-View` | The view name. |
| `X-Transform-Relay` | The relay origin. |
| `X-Transform-Signature` | `sha256=<hex>`, the HMAC-SHA256 of the raw request body. |

## Signature and secret

The signature is the hex HMAC-SHA256 of the raw request body, keyed with a
shared secret. The worker verifies it with a constant-time comparison before it
parses the body. A request without a valid signature is answered with `401`.

The operator stores the secret as a Workers secret named `BLOCK_TRANSFORM_SECRET`:

```sh
wrangler secret put BLOCK_TRANSFORM_SECRET --config services/shell/wrangler.jsonc
```

When the secret is not set, the endpoint answers `503` with a JSON error. A
misdeployed worker never renders unsigned input.

## Languages and renderers

Each block language is lowercased and looked up in this alias table. Every
renderer id is also accepted as a language.

| Language | Renderer |
| --- | --- |
| `mermaid`, `mmd` | `mermaid` |
| `dot`, `graphviz` | `graphviz` |
| `plantuml`, `puml`, `uml` | `plantuml` |
| `c4plantuml`, `c4` | `c4plantuml` |
| `svgbob`, `bob` | `svgbob` |
| `vegalite`, `vega-lite` | `vegalite` |
| `diagramsnet`, `drawio` | `diagramsnet` |
| `d2`, `pikchr`, `goat`, `tikz`, `ditaa`, `erd`, `nomnoml`, `wavedrom`, `vega`, `dbml`, `bpmn`, `bytefield`, `excalidraw`, `structurizr`, `umlet`, `squaring`, `trn`, `wireviz`, `symbolator` | the same id |
| `blockdiag`, `seqdiag`, `actdiag`, `nwdiag`, `packetdiag`, `rackdiag` | the same id |

Each block is posted to its renderer unit at
`https://{engine}.render.diagram.zip/v1/svg` with an empty presentation and no
renderer options. Up to six blocks render at the same time. Each render has a
20 second timeout.

## Appearance

The renderer unit answers with canonical SVG. The endpoint materializes it with
the requested appearance, as described in
[SVG normalization](/style/svg-normalization/). When the normalization profile
of a renderer does not support the requested appearance, the artifact falls
back to `raw` and reports that value. The `raw` appearance keeps the renderer
palette.

## Response

A successful transform answers `200` with `Cache-Control: no-store`:

```json
{
  "artifacts": [
    {
      "block": 0,
      "engine": "mermaid",
      "type": "image/svg+xml",
      "body": "<svg ...>",
      "appearance": "auto-transparent"
    }
  ],
  "errors": [
    { "block": 1, "engine": "d2", "error": "renderer answered 422: ..." }
  ]
}
```

A block failure never fails the request. A renderer error, a timeout, an
unreachable unit, or SVG that cannot be materialized becomes one entry in
`errors`. The other blocks still produce artifacts. Skipped languages
appear in neither list.

## Limits

The endpoint rejects a request with a JSON error in these cases:

| Condition | Status |
| --- | --- |
| Body larger than 1 MiB | `413` |
| More than 32 blocks | `413` |
| A block source longer than 512 KiB | `413` |
| Unknown appearance, invalid JSON, a malformed block, or an `event` field | `400` |
| Missing or wrong signature | `401` |
| Secret not configured | `503` |

Error bodies have the form `{"error": {"code": "...", "message": "..."}}`.
