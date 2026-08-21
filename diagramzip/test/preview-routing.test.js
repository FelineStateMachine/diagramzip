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
  controller.renderResponse = async response => response
  return controller
}

test('does not send a dedicated BlockDiag renderer failure to the gateway', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    return new Response('unavailable', { status: 503 })
  })

  await assert.rejects(
    controller.renderThroughGateway({ ...request, type: 'blockdiag' }, new AbortController().signal),
    /blockdiag renderer unit is unavailable/,
  )
  assert.deepEqual(endpoints, ['https://blockdiag.render.diagram.zip/v1/svg'])
})

test('does not send a dedicated BlockDiag renderer network error to the gateway', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    throw new TypeError('network unavailable')
  })

  await assert.rejects(
    controller.renderThroughGateway({ ...request, type: 'seqdiag' }, new AbortController().signal),
    /network unavailable/,
  )
  assert.deepEqual(endpoints, ['https://seqdiag.render.diagram.zip/v1/svg'])
})

test('keeps the compatibility gateway fallback for a residual engine', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    return endpoints.length === 1
      ? new Response('unavailable', { status: 503 })
      : new Response('<svg></svg>', { status: 200 })
  })

  const response = await controller.renderThroughGateway(
    { ...request, type: 'd2' },
    new AbortController().signal,
  )

  assert.equal(response.status, 200)
  assert.deepEqual(endpoints, [
    'https://d2.render.diagram.zip/v1/svg',
    '/render/v1/svg',
  ])
})

test('does not send a GraphViz-family failure to the gateway', async () => {
  const endpoints = []
  const controller = controllerWith(async endpoint => {
    endpoints.push(endpoint)
    return new Response('unavailable', { status: 503 })
  })

  await assert.rejects(
    controller.renderThroughGateway({ ...request, type: 'erd' }, new AbortController().signal),
    /erd renderer unit is unavailable/,
  )
  assert.deepEqual(endpoints, ['https://erd.render.diagram.zip/v1/svg'])
})

test('does not send a failed client renderer to the gateway', async () => {
  let gatewayCalls = 0
  const statuses = []
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
    async renderThroughGateway() { gatewayCalls += 1 },
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

  assert.equal(gatewayCalls, 0)
  assert.equal(statuses.at(-1).state, 'error')
})

test('does not send a failed diagrams.net renderer to the gateway', async () => {
  let gatewayCalls = 0
  const statuses = []
  const controller = {
    abortController: null,
    stage: { style: { setProperty() {} } },
    setStatus(message, state) { statuses.push({ message, state }) },
    async renderThroughGateway() { gatewayCalls += 1 },
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

  assert.equal(gatewayCalls, 0)
  assert.equal(statuses.at(-1).state, 'error')
})
