import assert from 'node:assert/strict'
import test from 'node:test'
import { PreviewController } from '../src/preview.js'

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
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
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
  assert.equal(statuses.at(-1).state, 'error')
})

test('does not send a failed diagrams.net renderer to an HTTP unit', async () => {
  let unitCalls = 0
  const statuses = []
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
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
  assert.equal(statuses.at(-1).state, 'error')
})
