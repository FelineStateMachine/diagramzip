import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PreviewController,
  previewBackgroundForAppearance,
  previewThemeForAppearance,
  previewViewKey,
} from '../src/preview.js'

const request = {
  source: 'blockdiag { A -> B; }',
  options: {},
  meta: {},
  presentation: {},
}

function controllerWith(renderRequest) {
  const controller = Object.create(PreviewController.prototype)
  controller.renderRequest = renderRequest
  controller.renderResponse = async response => {
    if (!response.ok) throw new Error(await response.text())
    return response
  }
  return controller
}

test('surfaces a dedicated BlockDiag renderer failure', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    return new Response('unavailable', { status: 503 })
  })

  await assert.rejects(
    controller.renderThroughUnit({ ...request, type: 'blockdiag' }, new AbortController().signal),
    /unavailable/,
  )
  assert.deepEqual(endpoints, ['https://blockdiag.render.diagram.zip/v1/svg'])
})

test('surfaces a dedicated BlockDiag renderer network error', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    throw new TypeError('network unavailable')
  })

  await assert.rejects(
    controller.renderThroughUnit({ ...request, type: 'seqdiag' }, new AbortController().signal),
    /network unavailable/,
  )
  assert.deepEqual(endpoints, ['https://seqdiag.render.diagram.zip/v1/svg'])
})

test('surfaces a GraphViz-family renderer failure', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    return new Response('unavailable', { status: 503 })
  })

  await assert.rejects(
    controller.renderThroughUnit({ ...request, type: 'erd' }, new AbortController().signal),
    /unavailable/,
  )
  assert.deepEqual(endpoints, ['https://erd.render.diagram.zip/v1/svg'])
})

test('does not send a failed client renderer to an HTTP unit', async () => {
  let unitCalls = 0
  const statuses = []
  const errors = []
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
    handleRenderError: PreviewController.prototype.handleRenderError,
    onError(message) { errors.push(message) },
    async renderThroughUnit() { unitCalls += 1 },
  }

  await PreviewController.prototype.performRender.call(controller, {
    type: 'mermaid',
    source: 'flowchart LR; A --> B',
    options: {},
    meta: {},
    presentation: {},
    renderKey: 'client-failure',
    requestNumber: 1,
  })

  assert.equal(unitCalls, 0)
  assert.equal(statuses.at(-1).state, 'idle')
  assert.equal(errors.length, 1)
  assert.equal(typeof errors[0], 'string')
})

test('does not send a failed diagrams.net renderer to an HTTP unit', async () => {
  let unitCalls = 0
  const statuses = []
  const errors = []
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
    handleRenderError: PreviewController.prototype.handleRenderError,
    onError(message) { errors.push(message) },
    async renderThroughUnit() { unitCalls += 1 },
  }

  await PreviewController.prototype.performRender.call(controller, {
    type: 'diagramsnet',
    source: '<mxGraphModel/>',
    options: {},
    meta: {},
    presentation: {},
    renderKey: 'diagramsnet-client-failure',
    requestNumber: 1,
  })

  assert.equal(unitCalls, 0)
  assert.equal(statuses.at(-1).state, 'idle')
  assert.equal(errors.length, 1)
  assert.equal(typeof errors[0], 'string')
})

test('keeps render details out of the status hint', () => {
  const attributes = new Map()
  const status = {
    dataset: {},
    setAttribute(name, value) { attributes.set(name, value) },
  }
  const controller = { status }

  PreviewController.prototype.setStatus.call(controller, 'The renderer is still working.', 'loading')

  assert.equal(status.textContent, 'Rendering')
  assert.equal(status.title, '')
  assert.equal(status.dataset.state, 'loading')
  assert.equal(attributes.get('aria-label'), 'Rendering')
})

test('routes render errors to the error callback and resets the status hint', () => {
  const statuses = []
  const errors = []
  const controller = {
    setStatus(message, state) { statuses.push({ message, state }) },
    onError(message) { errors.push(message) },
  }

  PreviewController.prototype.handleRenderError.call(controller, 'The renderer rejected this source.')

  assert.deepEqual(statuses, [{ message: 'Ready', state: 'idle' }])
  assert.deepEqual(errors, ['The renderer rejected this source.'])
})

test('matches the preview substrate to explicit and automatic SVG appearances', () => {
  assert.equal(previewThemeForAppearance('light-transparent'), 'light')
  assert.equal(previewThemeForAppearance('dark-framed'), 'dark')
  assert.equal(previewThemeForAppearance('auto-transparent'), 'auto')
  assert.equal(previewBackgroundForAppearance('light-transparent', '#fff'), 'var(--preview-light-bg)')
  assert.equal(previewBackgroundForAppearance('dark-transparent', '#fff'), 'var(--preview-dark-bg)')
  assert.equal(previewBackgroundForAppearance('auto-framed', '#fff'), 'var(--preview-auto-bg)')
  assert.equal(previewBackgroundForAppearance('raw', '#f4f4f4'), '#f4f4f4')
})

test('rematerializes automatic appearances when the preview system theme changes', () => {
  const displays = []
  const controller = {
    autoTheme: 'light',
    latestCanonicalSvg: '<svg/>',
    latestPresentation: { appearance: 'auto-transparent' },
    latestAppearance: 'auto-transparent',
    displayCanonical(...args) { displays.push(args) },
  }

  PreviewController.prototype.setAutoTheme.call(controller, 'dark')

  assert.equal(controller.autoTheme, 'dark')
  assert.deepEqual(displays, [[controller.latestCanonicalSvg, controller.latestPresentation, controller.latestAppearance]])
})

test('keeps one viewport identity across presentation-only changes', () => {
  const diagram = { type: 'd2', source: 'a -> b', options: {} }
  assert.equal(
    previewViewKey({ ...diagram, presentation: { appearance: 'light-transparent' } }),
    previewViewKey({ ...diagram, presentation: { appearance: 'dark-framed' } }),
  )
  assert.notEqual(
    previewViewKey(diagram),
    previewViewKey({ ...diagram, source: 'a -> c' }),
  )
})

test('preserves the current transform when a presentation-only image loads', () => {
  const calls = []
  const controller = {
    image: { src: 'blob:current', naturalWidth: 120, naturalHeight: 100 },
    activeImageUrl: 'blob:current',
    imageFallbackUrl: 'fallback',
    fitOnNextLoad: false,
    previousImageSize: { width: 100, height: 80 },
    scale: 2,
    x: 10,
    y: 20,
    setStatus() {},
    fit() { calls.push('fit') },
    updateTransform() { calls.push('preserve') },
  }

  PreviewController.prototype.handleImageLoad.call(controller)

  assert.deepEqual(calls, ['preserve'])
  assert.equal(controller.imageFallbackUrl, null)
  assert.equal(controller.x, -10)
  assert.equal(controller.y, 0)
  assert.equal(controller.previousImageSize, null)
})

test('fits once when a different diagram identity loads', () => {
  const calls = []
  const controller = {
    image: { src: 'blob:current', naturalWidth: 120, naturalHeight: 100 },
    activeImageUrl: 'blob:current',
    imageFallbackUrl: null,
    fitOnNextLoad: true,
    previousImageSize: { width: 100, height: 80 },
    setStatus() {},
    fit() { calls.push('fit') },
    updateTransform() { calls.push('preserve') },
  }

  PreviewController.prototype.handleImageLoad.call(controller)

  assert.deepEqual(calls, ['fit'])
  assert.equal(controller.fitOnNextLoad, false)
})
