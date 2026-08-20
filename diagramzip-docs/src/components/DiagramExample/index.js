import React, {useCallback, useEffect, useRef, useState} from 'react';
import {fitView, zoomView} from './viewMath.mjs';
import styles from './styles.module.css';

const RENDER_URL = 'https://diagram.zip/render/v1/svg';

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
        const renderResponse = await fetch(RENDER_URL, {
          method: 'POST',
          headers: {Accept: 'image/svg+xml', 'Content-Type': 'application/json'},
          body: JSON.stringify({
            engine,
            source: example.source,
            format: 'svg',
            options: {},
            metadata: {},
            presentation: {background: '', padding: 24, frame: false},
          }),
          signal: abortController.signal,
        });
        if (!renderResponse.ok) throw new Error(await responseError(renderResponse));
        const source = normalizeSvg(await renderResponse.text());
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
