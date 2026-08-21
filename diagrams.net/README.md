# Diagrams.net server

Version: 29.6.1

## Update

Clone the https://github.com/jgraph/drawio repository and checkout a tag.
Replace the following files and directories:

| Source                             | Destination               |
|------------------------------------|---------------------------|
| `src/main/webapp/export3.html`     | `assets/index.html`       |
| `src/main/webapp/images`           | `assets/images`           |
| `src/main/webapp/img`              | `assets/img`              |
| `src/main/webapp/math4`            | `assets/math4`            |
| `src/main/webapp/mxgraph`          | `assets/mxgraph`          |
| `src/main/webapp/shapes`           | `assets/shapes`           |
| `src/main/webapp/stencils`         | `assets/stencils`         |
| `src/main/webapp/export-fonts.css` | `assets/export-fonts.css` |

You can also use the `import.sh` script to perform the sync:

```bash
$ ./import.sh /path/to/drawio/checkout assets/
```

The checked-in export runtime is sourced from the `v29.6.1` tag at commit
`15f3c0fefb172bd98a2a380ee120a55ca690c85d`. The two files that drive the
client renderer are kept byte-for-byte from that checkout:

| File | SHA-256 |
| --- | --- |
| `assets/js/export.js` | `2dbdaad9adb96af52937f38dfccee03b39f771d621e75f0ae93f40c04f9e3b46` |
| `assets/js/export-init.js` | `cf9b6518b7f34c62ff0cc3f1f049fae340d2e7f8b486b3261ee5bff211a73d58` |
