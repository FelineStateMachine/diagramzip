const ICON_KIND_BY_TYPE = Object.freeze({
  plantuml: 'sequence', mermaid: 'flow', seqdiag: 'sequence', actdiag: 'flow', blockdiag: 'flow', bpmn: 'flow', trn: 'flow',
  c4plantuml: 'layers', structurizr: 'layers', d2: 'graph', graphviz: 'graph', nomnoml: 'classes', umlet: 'classes',
  dbml: 'database', erd: 'database', vega: 'chart', vegalite: 'chart',
  nwdiag: 'network', packetdiag: 'packet', rackdiag: 'rack', bytefield: 'packet', wavedrom: 'wave', symbolator: 'chip', wireviz: 'cable', squaring: 'squares',
  excalidraw: 'drawing', diagramsnet: 'canvas', ditaa: 'terminal', goat: 'terminal', svgbob: 'terminal', pikchr: 'drawing', tikz: 'typeset',
})

const ICON_PATHS = Object.freeze({
  sequence: '<path d="M12 7v38M30 7v38M48 7v38M12 16h18l-4-4m4 4-4 4M48 34H30l4-4m-4 4 4 4"/>',
  flow: '<rect x="7" y="23" width="13" height="10" rx="2"/><rect x="40" y="9" width="13" height="10" rx="2"/><rect x="40" y="37" width="13" height="10" rx="2"/><path d="M20 28h10V14h10M30 28v14h10"/>',
  layers: '<rect x="12" y="12" width="31" height="22" rx="2"/><rect x="17" y="17" width="31" height="22" rx="2"/><rect x="22" y="22" width="31" height="22" rx="2"/><path d="M28 30h14M28 36h10"/>',
  graph: '<circle cx="12" cy="29" r="5"/><circle cx="30" cy="13" r="5"/><circle cx="48" cy="29" r="5"/><circle cx="30" cy="45" r="5"/><path d="m16 25 10-9m8 0 10 9m0 8-10 9m-8 0-10-9m1-4h26"/>',
  classes: '<rect x="6" y="10" width="20" height="36" rx="2"/><rect x="38" y="18" width="16" height="28" rx="2"/><path d="M6 20h20M6 29h20M38 28h16M26 27h7l5-5m-5 5 5 5"/>',
  database: '<ellipse cx="18" cy="13" rx="10" ry="5"/><path d="M8 13v28c0 3 4 5 10 5s10-2 10-5V13m-20 9c0 3 4 5 10 5s10-2 10-5m0 9c0 3-4 5-10 5S8 34 8 31"/><rect x="38" y="19" width="16" height="26" rx="2"/><path d="M38 28h16M38 36h16M28 31h10"/>',
  chart: '<path d="M8 47V9m0 38h46"/><rect x="15" y="32" width="7" height="15" rx="1"/><rect x="28" y="22" width="7" height="25" rx="1"/><rect x="41" y="12" width="7" height="35" rx="1"/>',
  network: '<circle cx="10" cy="29" r="5"/><circle cx="30" cy="12" r="5"/><circle cx="50" cy="29" r="5"/><circle cx="30" cy="46" r="5"/><path d="m14 25 12-10m8 0 12 10m0 8L34 43m-8 0L14 33"/>',
  packet: '<path d="M7 17h46v25H7zM18 17v25M30 17v25M42 17v25M7 29h46"/><path d="m23 11 7-5 7 5"/>',
  rack: '<rect x="13" y="7" width="34" height="46" rx="3"/><path d="M13 18h34M13 29h34M13 40h34M20 13h16M20 24h20M20 35h13M20 46h18"/>',
  wave: '<path d="M5 18h9V8h10v20h10V13h10v15h11M5 42h8l4-12 7 24 8-24 7 12h16"/>',
  chip: '<rect x="14" y="13" width="32" height="34" rx="3"/><path d="M22 23h16v14H22zM7 20h7M7 29h7M7 40h7M46 20h7M46 29h7M46 40h7M21 7v6M30 7v6M39 7v6M21 47v6M30 47v6M39 47v6"/>',
  cable: '<path d="M8 17h12v10H8zM40 33h12v10H40zM20 22h7a8 8 0 0 1 8 8v3h5M13 27v12c0 4 3 7 7 7h11"/><circle cx="31" cy="46" r="2"/>',
  drawing: '<path d="m11 45 4-14L40 6l10 10-25 25-14 4Z"/><path d="m16 30 10 10M36 10l10 10M11 45l9-3-6-6-3 9Z"/>',
  canvas: '<rect x="7" y="10" width="46" height="39" rx="3"/><circle cx="19" cy="23" r="5"/><path d="m10 43 13-12 8 7 8-10 11 15M43 16h4M45 14v4"/>',
  terminal: '<rect x="6" y="10" width="48" height="40" rx="4"/><path d="m14 22 7 6-7 6M27 36h14"/>',
  squares: '<rect x="7" y="7" width="26" height="26"/><rect x="33" y="7" width="20" height="20"/><rect x="33" y="27" width="14" height="14"/><rect x="47" y="27" width="6" height="6"/><rect x="47" y="33" width="6" height="6"/><rect x="33" y="41" width="12" height="12"/><rect x="45" y="39" width="8" height="8"/><rect x="7" y="33" width="20" height="20"/><rect x="27" y="33" width="6" height="6"/><rect x="27" y="39" width="6" height="6"/><rect x="27" y="45" width="6" height="8"/><rect x="45" y="47" width="8" height="6"/>',
  typeset: '<path d="M13 12h34M30 12v36M21 48h18M14 21h11M35 39h11"/><path d="m42 21 5 5-5 5"/>',
})

export function formatIconKind(type) {
  return ICON_KIND_BY_TYPE[type] ?? 'canvas'
}

export function hasFormatIcon(type) {
  return Object.hasOwn(ICON_KIND_BY_TYPE, type)
}

export function formatIconMarkup(type) {
  return `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">${ICON_PATHS[formatIconKind(type)]}</svg>`
}
