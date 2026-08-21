import {canonicalizeSvg} from '../../../../../shared/svg/index.js';

export function rendererVersionFromHeaders(headers) {
  return [
    headers.get('X-Diagram-Engine-Version'),
    headers.get('X-Renderer-Build'),
  ].filter(Boolean).join(' ');
}

export function canonicalizeHttpRendererSvg(source, engine, headers) {
  return canonicalizeSvg(
    source,
    {title: '', description: ''},
    engine,
    rendererVersionFromHeaders(headers),
  );
}
