import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PreviewController,
  previewBackgroundForAppearance,
  previewThemeForAppearance,
  previewViewKey,
} from '../src/preview.js'
import { httpRendererUnitFor } from '../src/renderer-units.js'

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

test('routes formerly client-rendered engines through HTTP units', () => {
  for (const type of ['mermaid', 'bpmn', 'excalidraw', 'diagramsnet', 'tikz']) {
    assert.equal(httpRendererUnitFor(type), `https://${type}.render.diagram.zip/v1/svg`)
  }
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

test('returns canonical SVG only for the exact current editable state', () => {
  const controller = {
    latestRenderKey: JSON.stringify(request),
    latestCanonicalSvg: '<svg data-dz-schema="1"></svg>',
  }
  assert.equal(PreviewController.prototype.canonicalSvgFor.call(controller, request), controller.latestCanonicalSvg)
  assert.equal(PreviewController.prototype.canonicalSvgFor.call(controller, { ...request, source: 'changed' }), null)
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

test('keeps the current image until its decoded replacement can be committed', async () => {
  let finishDecode
  const revoked = []
  const originalRevokeObjectUrl = URL.revokeObjectURL
  URL.revokeObjectURL = url => revoked.push(url)
  const image = { src: 'blob:current', hidden: false, naturalWidth: 120, naturalHeight: 80 }
  const minimapImage = { src: 'blob:current' }
  const backgrounds = []
  const controller = {
    imageSwapNumber: 2,
    objectUrl: 'blob:current',
    activeImageUrl: 'blob:current',
    imageFallbackUrl: null,
    image,
    minimapImage,
    fitOnNextLoad: false,
    stage: {
      dataset: { previewTheme: 'light' },
      style: { setProperty(name, value) { backgrounds.push([name, value]) } },
    },
    decodeImage() { return new Promise(resolve => { finishDecode = resolve }) },
  }

  try {
    const swap = PreviewController.prototype.swapDecodedImage.call(controller, {
      objectUrl: 'blob:next',
      fallbackUrl: 'data:next',
      background: 'var(--preview-dark-bg)',
      theme: 'dark',
    }, 2)

    await Promise.resolve()
    assert.equal(image.src, 'blob:current')
    assert.equal(minimapImage.src, 'blob:current')
    assert.deepEqual(revoked, [])

    finishDecode()
    await swap

    assert.equal(image.src, 'blob:next')
    assert.equal(minimapImage.src, 'blob:next')
    assert.equal(controller.stage.dataset.previewTheme, 'dark')
    assert.deepEqual(backgrounds, [['--render-background', 'var(--preview-dark-bg)']])
    assert.deepEqual(revoked, ['blob:current'])
  } finally {
    URL.revokeObjectURL = originalRevokeObjectUrl
  }
})

test('discards a decoded image when a newer render has superseded it', async () => {
  const revoked = []
  const originalRevokeObjectUrl = URL.revokeObjectURL
  URL.revokeObjectURL = url => revoked.push(url)
  const controller = {
    imageSwapNumber: 4,
    objectUrl: 'blob:current',
    image: { src: 'blob:current' },
    minimapImage: { src: 'blob:current' },
    async decodeImage() {},
  }

  try {
    await PreviewController.prototype.swapDecodedImage.call(controller, {
      objectUrl: 'blob:stale',
      fallbackUrl: 'data:stale',
      background: '#000000',
      theme: 'dark',
    }, 3)

    assert.equal(controller.image.src, 'blob:current')
    assert.equal(controller.minimapImage.src, 'blob:current')
    assert.deepEqual(revoked, ['blob:stale'])
  } finally {
    URL.revokeObjectURL = originalRevokeObjectUrl
  }
})
