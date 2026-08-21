# diagram.zip documentation

This directory contains the Docusaurus site for `docs.diagram.zip`.

The canonical source repository is `https://github.com/FelineStateMachine/diagramzip`.

## Local development

Use Node.js 20 or a later version.

```sh
npm install
npm start
```

The `start` command generates the diagram reference before it starts the local server.

## Checks

```sh
npm run build
```

The build command does these tasks:

1. It generates the type pages and the machine-readable files.
2. It checks the content structure and the selected Simplified Technical English rules.
3. It creates the static site in `build/`.

## Cloudflare Pages

Use these project settings for a Git integration:

- Root directory: `apps/docs`
- Build command: `npm run build`
- Build output directory: `build`
- Custom domain: `docs.diagram.zip`

You can also upload the build with this command:

```sh
npm run deploy:preview
```

Associate `docs.diagram.zip` with the Pages project before you add or change its DNS record.
