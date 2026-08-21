import { clientAdapterFor } from './client-renderers.js'
import { sanitizeAndDecorateSvg } from './client-svg.js'
import { httpRendererUnitFor } from './renderer-units.js'

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

export class PreviewController {
  constructor({ stage, image, status, minimap, minimapImage, minimapViewport }) {
    this.stage = stage
    this.image = image
    this.status = status
    this.minimap = minimap
    this.minimapImage = minimapImage
    this.minimapViewport = minimapViewport
    this.scale = 1
    this.x = 0
    this.y = 0
    this.objectUrl = null
    this.abortController = null
    this.requestNumber = 0
    this.pendingRender = null
    this.renderLoop = null
    this.latestRenderKey = null
    this.latestSvgBlob = null
    this.latestRendererIdentity = null
    this.imageFallbackUrl = null
    this.activeImageUrl = null
    this.drag = null

    this.image.addEventListener('load', () => {
      if (this.image.src !== this.activeImageUrl) return
      this.imageFallbackUrl = null
      this.setStatus('Rendered', 'ready')
      this.fit()
    })
    this.image.addEventListener('error', () => this.retryBlockedImage())
    this.stage.addEventListener('pointerdown', event => this.startPan(event))
    this.stage.addEventListener('pointermove', event => this.pan(event))
    this.stage.addEventListener('pointerup', event => this.endPan(event))
    this.stage.addEventListener('pointercancel', event => this.endPan(event))
    this.stage.addEventListener('wheel', event => this.wheelZoom(event), { passive: false })
    this.minimap.addEventListener('pointerdown', event => this.moveFromMinimap(event))
    new ResizeObserver(() => this.updateTransform()).observe(this.stage)
  }

  render({ type, source, options = {}, meta = {}, presentation = {} }) {
    if (!source.trim()) {
      this.requestNumber++
      this.pendingRender = null
      this.abortController?.abort()
      this.setStatus('Write something to render.', 'idle')
      return
    }

    const renderKey = JSON.stringify({ type, source, options, meta, presentation })
    if (this.latestRenderKey === renderKey && this.latestSvgBlob) return Promise.resolve()

    this.pendingRender = { type, source, options, meta, presentation, renderKey, requestNumber: ++this.requestNumber }
    this.abortController?.abort()
    if (!this.renderLoop) this.renderLoop = this.drainRenderQueue()
    return this.renderLoop
  }

  async drainRenderQueue() {
    try {
      while (this.pendingRender) {
        const render = this.pendingRender
        this.pendingRender = null
        await this.performRender(render)
      }
    } finally {
      this.renderLoop = null
      if (this.pendingRender) this.renderLoop = this.drainRenderQueue()
    }
  }

  async performRender({ type, source, options, meta, presentation, renderKey, requestNumber }) {
    const abortController = new AbortController()
    this.abortController = abortController
    this.setStatus('Rendering…', 'loading')
    this.stage.style.setProperty('--render-background', 'var(--preview-bg)')

    try {
      const clientAdapter = clientAdapterFor(type)
      let rendered
      if (clientAdapter) {
        const clientRender = await clientAdapter.render({ type, source, options }, abortController.signal)
        rendered = {
          body: sanitizeAndDecorateSvg(clientRender.body, meta, presentation, type),
          identity: {
            unit: type,
            build: clientRender.build || clientRender.version,
            pipeline: Array.isArray(clientRender.pipeline) ? clientRender.pipeline : [type],
          },
        }
        this.status.dataset.cache = 'browser'
        this.status.dataset.renderer = type
      } else {
        rendered = await this.renderThroughUnit({ type, source, options, meta, presentation }, abortController.signal)
      }
      if (requestNumber !== this.requestNumber) return
      const { blob, background } = this.normalizedSvgBlob(rendered.body)
      this.latestRenderKey = renderKey
      this.latestSvgBlob = blob
      this.latestRendererIdentity = rendered.identity
      this.imageFallbackUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await blob.text())}`
      this.stage.style.setProperty('--render-background', background)
      const nextObjectUrl = URL.createObjectURL(blob)
      const previousObjectUrl = this.objectUrl
      this.objectUrl = nextObjectUrl
      this.activeImageUrl = nextObjectUrl
      this.image.src = nextObjectUrl
      this.minimapImage.src = nextObjectUrl
      this.image.hidden = false
      this.setStatus('Loading image…', 'loading')
      if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl)
    } catch (error) {
      if (error.name === 'AbortError') return
      this.setStatus(error.message || 'Could not render this diagram.', 'error')
    } finally {
      if (this.abortController === abortController) this.abortController = null
    }
  }

  async renderThroughUnit({ type, source, options, meta, presentation }, signal) {
    const unitEndpoint = httpRendererUnitFor(type)
    if (!unitEndpoint) throw new Error(`No renderer is registered for ${type}.`)
    const response = await this.renderRequest(unitEndpoint, {
      source,
      format: 'svg',
      options,
      metadata: meta,
      presentation,
    }, signal)
    return this.renderResponse(response, type)
  }

  renderRequest(endpoint, body, signal) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  }

  async renderResponse(response, fallbackUnit) {
    if (!response.ok) throw new Error(await this.errorMessage(response))
    this.status.dataset.cache = response.headers.get('X-Diagram-Cache')?.toLowerCase() ?? 'miss'
    this.status.dataset.renderer = response.headers.get('X-Diagram-Unit')?.toLowerCase()
      ?? response.headers.get('X-Diagram-Renderer')?.toLowerCase()
      ?? fallbackUnit
    const unit = response.headers.get('X-Diagram-Unit')?.toLowerCase()
      ?? response.headers.get('X-Diagram-Engine')?.toLowerCase()
      ?? fallbackUnit
    const build = response.headers.get('X-Renderer-Build')
      ?? response.headers.get('X-Diagram-Engine-Version')
      ?? `${unit}-unknown`
    const pipeline = (response.headers.get('X-Diagram-Pipeline') ?? unit)
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
    return { body: await response.text(), identity: { unit, build, pipeline } }
  }

  retryBlockedImage() {
    if (this.image.src !== this.activeImageUrl) return
    if (this.imageFallbackUrl && this.activeImageUrl.startsWith('blob:')) {
      const fallback = this.imageFallbackUrl
      this.imageFallbackUrl = null
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
      this.activeImageUrl = fallback
      this.image.src = fallback
      this.minimapImage.src = fallback
      return
    }
    this.setStatus('The rendered image was blocked or invalid.', 'error')
  }

  svgBlobFor(state) {
    const { type, source, options = {}, meta = {}, presentation = {} } = state
    const renderKey = JSON.stringify({ type, source, options, meta, presentation })
    return this.latestRenderKey === renderKey ? this.latestSvgBlob : null
  }

  rendererIdentityFor(state) {
    const { type, source, options = {}, meta = {}, presentation = {} } = state
    const renderKey = JSON.stringify({ type, source, options, meta, presentation })
    return this.latestRenderKey === renderKey ? this.latestRendererIdentity : null
  }

  async errorMessage(response) {
    const body = await response.text()
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      try {
        const payload = JSON.parse(body)
        if (typeof payload?.error?.message === 'string') return payload.error.message
      } catch {
        // Use the HTML/plain-text parser below.
      }
    }
    const document = new DOMParser().parseFromString(body, 'text/html')
    const message = document.body.textContent.trim().replace(/\s+/g, ' ')
    return message || `Render failed with HTTP ${response.status}.`
  }

  normalizedSvgBlob(source) {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml')
    const svg = document.documentElement
    const viewBox = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
    if (svg.nodeName === 'svg' && viewBox?.length === 4 && viewBox.every(Number.isFinite)) {
      if (!svg.hasAttribute('width')) svg.setAttribute('width', String(viewBox[2]))
      if (!svg.hasAttribute('height')) svg.setAttribute('height', String(viewBox[3]))
      source = new XMLSerializer().serializeToString(svg)
    }
    const declaredBackground = svg.style.backgroundColor || svg.style.background
    const background = declaredBackground && declaredBackground !== 'transparent'
      ? declaredBackground
      : '#ffffff'
    return {
      blob: new Blob([source], { type: 'image/svg+xml' }),
      background,
    }
  }

  setStatus(message, state) {
    this.status.textContent = message
    this.status.dataset.state = state
  }

  zoom(factor) {
    if (this.image.hidden) return
    const bounds = this.stage.getBoundingClientRect()
    this.zoomAt(factor, bounds.width / 2, bounds.height / 2)
  }

  zoomAt(factor, anchorX, anchorY) {
    const nextScale = clamp(this.scale * factor, 0.1, 8)
    const diagramX = (anchorX - this.x) / this.scale
    const diagramY = (anchorY - this.y) / this.scale
    this.x = anchorX - diagramX * nextScale
    this.y = anchorY - diagramY * nextScale
    this.scale = nextScale
    this.updateTransform()
  }

  wheelZoom(event) {
    if (this.image.hidden || event.target.closest('.preview-toolbar, .minimap')) return
    event.preventDefault()
    const bounds = this.stage.getBoundingClientRect()
    const delta = event.deltaY * (
      event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? bounds.height
          : 1
    )
    this.zoomAt(
      Math.exp(-clamp(delta, -240, 240) * 0.002),
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    )
  }

  oneToOne() {
    if (this.image.hidden) return
    const bounds = this.stage.getBoundingClientRect()
    this.scale = 1
    this.x = (bounds.width - this.image.naturalWidth) / 2
    this.y = (bounds.height - this.image.naturalHeight) / 2
    this.updateTransform()
  }

  fit() {
    if (!this.image.naturalWidth || !this.image.naturalHeight) return
    const bounds = this.stage.getBoundingClientRect()
    const padding = Math.min(64, bounds.width * 0.12)
    this.scale = clamp(Math.min(
      (bounds.width - padding * 2) / this.image.naturalWidth,
      (bounds.height - padding * 2) / this.image.naturalHeight,
    ), 0.1, 2)
    this.x = (bounds.width - this.image.naturalWidth * this.scale) / 2
    this.y = (bounds.height - this.image.naturalHeight * this.scale) / 2
    this.updateTransform()
  }

  updateTransform() {
    this.image.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`
    this.updateMinimap()
  }

  startPan(event) {
    if (this.image.hidden || event.button !== 0 || event.target.closest('.preview-toolbar, .minimap')) return
    this.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: this.x, originY: this.y }
    this.stage.setPointerCapture(event.pointerId)
    this.stage.dataset.dragging = 'true'
  }

  pan(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return
    this.x = this.drag.originX + event.clientX - this.drag.x
    this.y = this.drag.originY + event.clientY - this.drag.y
    this.updateTransform()
  }

  endPan(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return
    this.drag = null
    delete this.stage.dataset.dragging
  }

  moveFromMinimap(event) {
    if (!this.image.naturalWidth || !this.image.naturalHeight) return
    const bounds = this.minimap.getBoundingClientRect()
    const imageFit = Math.min(bounds.width / this.image.naturalWidth, bounds.height / this.image.naturalHeight)
    const offsetX = (bounds.width - this.image.naturalWidth * imageFit) / 2
    const offsetY = (bounds.height - this.image.naturalHeight * imageFit) / 2
    const diagramX = (event.clientX - bounds.left - offsetX) / imageFit
    const diagramY = (event.clientY - bounds.top - offsetY) / imageFit
    const stageBounds = this.stage.getBoundingClientRect()
    this.x = stageBounds.width / 2 - diagramX * this.scale
    this.y = stageBounds.height / 2 - diagramY * this.scale
    this.updateTransform()
  }

  updateMinimap() {
    if (!this.image.naturalWidth || !this.image.naturalHeight) return
    const stageBounds = this.stage.getBoundingClientRect()
    const renderedWidth = this.image.naturalWidth * this.scale
    const renderedHeight = this.image.naturalHeight * this.scale
    const fullyVisible = this.x >= 0
      && this.y >= 0
      && this.x + renderedWidth <= stageBounds.width
      && this.y + renderedHeight <= stageBounds.height
    this.minimap.hidden = fullyVisible
    if (fullyVisible) return

    const minimapBounds = this.minimap.getBoundingClientRect()
    const imageFit = Math.min(
      minimapBounds.width / this.image.naturalWidth,
      minimapBounds.height / this.image.naturalHeight,
    )
    const offsetX = (minimapBounds.width - this.image.naturalWidth * imageFit) / 2
    const offsetY = (minimapBounds.height - this.image.naturalHeight * imageFit) / 2
    const visibleLeft = clamp(-this.x / this.scale, 0, this.image.naturalWidth)
    const visibleTop = clamp(-this.y / this.scale, 0, this.image.naturalHeight)
    const visibleRight = clamp((stageBounds.width - this.x) / this.scale, 0, this.image.naturalWidth)
    const visibleBottom = clamp((stageBounds.height - this.y) / this.scale, 0, this.image.naturalHeight)

    this.minimapViewport.style.left = `${offsetX + visibleLeft * imageFit}px`
    this.minimapViewport.style.top = `${offsetY + visibleTop * imageFit}px`
    this.minimapViewport.style.width = `${Math.max(4, (visibleRight - visibleLeft) * imageFit)}px`
    this.minimapViewport.style.height = `${Math.max(4, (visibleBottom - visibleTop) * imageFit)}px`
  }
}
