import React, {useCallback, useEffect, useRef, useState} from 'react';
import {canonicalizeSvg, materializeSvg, supportedAppearances} from '../../../../../shared/svg/index.js';
import {canonicalizeHttpRendererSvg} from './httpSvg.mjs';
import {fitView, zoomView} from './viewMath.mjs';
import {clientFrameUrlFor, httpRendererUrlFor} from './rendererRouting.mjs';
import styles from './styles.module.css';

const CHANNEL = 'diagram.zip:renderer:v1';
const RENDER_TIMEOUT = 60_000;
const clientFrames = new Map();

class RendererFrame {
  constructor(frameUrl) {
    this.frameUrl = frameUrl;
    this.frame = null;
    this.ready = null;
    this.pending = new Map();
    this.sequence = 0;
    this.handleMessage = (event) => this.receive(event);
    window.addEventListener('message', this.handleMessage);
  }

  ensureFrame() {
    if (this.frame) return this.ready;
    const frame = document.createElement('iframe');
    frame.title = 'Diagram renderer';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    Object.assign(frame.style, {
      position: 'fixed', left: '-200vw', top: '0', width: '1280px', height: '800px',
      border: '0', pointerEvents: 'none', visibility: 'hidden',
    });
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    frame.addEventListener('error', () => this.rejectReady?.(new Error('The client renderer could not be loaded.')), {once: true});
    frame.src = this.frameUrl;
    this.frame = frame;
    document.body.append(frame);
    return this.ready;
  }

  receive(event) {
    if (!this.frame || event.source !== this.frame.contentWindow || event.data?.channel !== CHANNEL) return;
    if (event.data.type === 'ready') {
      this.resolveReady?.();
      this.resolveReady = null;
      this.rejectReady = null;
      return;
    }
    if (event.data.type !== 'result') return;
    const pending = this.pending.get(event.data.requestId);
    if (!pending) return;
    this.pending.delete(event.data.requestId);
    pending.finish();
    if (event.data.ok && typeof event.data.svg === 'string') pending.resolve({
      svg: event.data.svg,
      version: typeof event.data.version === 'string' ? event.data.version : '',
    });
    else pending.reject(new Error(event.data.error || 'Client rendering failed.'));
  }

  async render(engine, source, signal) {
    let loadTimeout;
    try {
      await Promise.race([
        this.ensureFrame(),
        new Promise((_, reject) => { loadTimeout = setTimeout(() => reject(new Error('The client renderer timed out while loading.')), RENDER_TIMEOUT); }),
      ]);
    } finally {
      clearTimeout(loadTimeout);
    }
    if (signal.aborted) throw signal.reason || new DOMException('Render superseded.', 'AbortError');
    const requestId = `${Date.now().toString(36)}-${++this.sequence}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        signal.removeEventListener('abort', onAbort);
        reject(new Error('The client renderer timed out.'));
      }, RENDER_TIMEOUT);
      const onAbort = () => {
        this.pending.delete(requestId);
        clearTimeout(timeout);
        reject(signal.reason || new DOMException('Render superseded.', 'AbortError'));
      };
      const finish = () => {
        clearTimeout(timeout);
        signal.removeEventListener('abort', onAbort);
      };
      signal.addEventListener('abort', onAbort, {once: true});
      this.pending.set(requestId, {resolve, reject, finish});
      this.frame.contentWindow.postMessage({channel: CHANNEL, type: 'render', requestId, engine, source}, '*');
    });
  }
}

function clientRendererFor(engine) {
  const frameUrl = clientFrameUrlFor(engine);
  if (!frameUrl) return null;
  let renderer = clientFrames.get(frameUrl);
  if (!renderer) {
    renderer = new RendererFrame(frameUrl);
    clientFrames.set(frameUrl, renderer);
  }
  return renderer;
}

function normalizeSvg(source) {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = document.documentElement;
  const viewBox = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (svg.nodeName === 'svg' && viewBox?.length === 4 && viewBox.every(Number.isFinite)) {
    if (!svg.hasAttribute('width')) svg.setAttribute('width', String(viewBox[2]));
    if (!svg.hasAttribute('height')) svg.setAttribute('height', String(viewBox[3]));
    return new XMLSerializer().serializeToString(svg);
  }
  return source;
}

async function responseError(response) {
  const body = await response.text();
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    try {
      const payload = JSON.parse(body);
      if (typeof payload?.error?.message === 'string') return payload.error.message;
    } catch {
      // Use the plain response text.
    }
  }
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || `The renderer returned HTTP ${response.status}.`;
}

export default function DiagramExample({engine, label, sourceUrl}) {
  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('Loading the example…');
  const [view, setView] = useState({scale: 1, x: 0, y: 0});

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image?.naturalWidth || !image?.naturalHeight) return;
    setView(fitView(
      viewport.clientWidth,
      viewport.clientHeight,
      image.naturalWidth,
      image.naturalHeight,
      Math.min(48, viewport.clientWidth * 0.08),
    ));
  }, []);

  const zoom = useCallback((factor, anchor) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const x = anchor?.x ?? viewport.clientWidth / 2;
    const y = anchor?.y ?? viewport.clientHeight / 2;
    setView((current) => zoomView(current, factor, x, y));
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function render() {
      setStatus('Loading the example…');
      try {
        const exampleResponse = await fetch(sourceUrl, {signal: abortController.signal});
        if (!exampleResponse.ok) throw new Error('The example source is not available.');
        const example = await exampleResponse.json();
        const clientRenderer = clientRendererFor(engine);
        let source;
        if (clientRenderer) {
          const clientResult = await clientRenderer.render(engine, example.source, abortController.signal);
          source = canonicalizeSvg(clientResult.svg, {title: '', description: ''}, engine, clientResult.version);
        } else {
          const renderResponse = await fetch(httpRendererUrlFor(engine), {
            method: 'POST',
            headers: {Accept: 'image/svg+xml', 'Content-Type': 'application/json'},
            body: JSON.stringify({
              source: example.source,
              format: 'svg',
              options: {},
              metadata: {},
              presentation: {background: '', padding: 0, frame: false},
            }),
            signal: abortController.signal,
          });
          if (!renderResponse.ok) throw new Error(await responseError(renderResponse));
          source = canonicalizeHttpRendererSvg(await renderResponse.text(), engine, renderResponse.headers);
        }
        const appearances = supportedAppearances(source);
        const appearance = appearances.includes('auto-transparent')
          ? 'auto-transparent'
          : appearances.includes('auto-framed') ? 'auto-framed' : 'raw';
        source = materializeSvg(source, appearance);
        source = normalizeSvg(source);
        const objectUrl = URL.createObjectURL(new Blob([source], {type: 'image/svg+xml'}));
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = objectUrl;
        setImageUrl(objectUrl);
        setStatus('Loading the rendered image…');
      } catch (error) {
        if (error.name !== 'AbortError') setStatus(error.message || 'The example could not render.');
      }
    }

    render();
    return () => {
      abortController.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, [engine, sourceUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const wheelZoom = (event) => {
      if (!imageUrl) return;
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const delta = Math.max(-240, Math.min(240, event.deltaY));
      zoom(Math.exp(-delta * 0.002), {x: event.clientX - bounds.left, y: event.clientY - bounds.top});
    };
    viewport.addEventListener('wheel', wheelZoom, {passive: false});
    return () => viewport.removeEventListener('wheel', wheelZoom);
  }, [imageUrl, zoom]);

  function startPan(event) {
    if (!imageUrl || event.button !== 0) return;
    dragRef.current = {pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: view.x, y: view.y};
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
  }

  function pan(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setView((current) => ({...current, x: drag.x + event.clientX - drag.clientX, y: drag.y + event.clientY - drag.clientY}));
  }

  function endPan(event) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  return (
    <figure className={styles.example}>
      <div className={styles.heading}>
        <div>
          <strong>Rendered example</strong>
          <span>Drag to pan. Use the wheel or controls to zoom.</span>
        </div>
        <div className={styles.controls} aria-label="Diagram view controls">
          <button type="button" onClick={() => zoom(0.8)} aria-label="Zoom out">−</button>
          <output aria-label="Zoom level">{Math.round(view.scale * 100)}%</output>
          <button type="button" onClick={() => zoom(1.25)} aria-label="Zoom in">+</button>
          <button type="button" onClick={fit}>Fit</button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className={styles.viewport}
        role="img"
        aria-label={`Rendered ${label} example. Drag to pan and use the controls to zoom.`}
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        {imageUrl && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt=""
            draggable="false"
            onLoad={() => { setStatus('Rendered'); fit(); }}
            onError={() => setStatus('The rendered image could not load.')}
            style={{transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}
          />
        )}
        {status !== 'Rendered' && <p className={styles.status} role="status">{status}</p>}
      </div>
      <figcaption>This view uses the live diagram.zip renderer.</figcaption>
    </figure>
  );
}
