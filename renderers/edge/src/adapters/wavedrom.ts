import JSON5 from 'json5'
import { s as serializeOnml } from 'onml'
import { renderAny } from 'wavedrom'
import darkSkins from 'wavedrom/skins/dark.js'
import defaultSkins from 'wavedrom/skins/default.js'
import lowkeySkins from 'wavedrom/skins/lowkey.js'
import narrowSkins from 'wavedrom/skins/narrow.js'
import narrowerSkins from 'wavedrom/skins/narrower.js'
import narrowererSkins from 'wavedrom/skins/narrowerer.js'
import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'wavedrom@3.6.2'

const skins = {
  dark: darkSkins.dark,
  default: defaultSkins.default,
  lowkey: lowkeySkins.lowkey,
  narrow: narrowSkins.narrow,
  narrower: narrowerSkins.narrower,
  narrowerer: narrowererSkins.narrowerer,
}

export const wavedromAdapter: RendererAdapter = {
  id: 'wavedrom',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      const specification: unknown = JSON5.parse(request.source)
      const skin = request.options.skin
      if (skin !== undefined && !(skin in skins)) {
        throw new RenderError(400, 'invalid_options', `Unknown WaveDrom skin: ${skin}.`)
      }
      if (skin !== undefined && typeof specification === 'object' && specification !== null) {
        const currentConfig = 'config' in specification && typeof specification.config === 'object' && specification.config !== null
          ? specification.config
          : {}
        Object.assign(specification, { config: { ...currentConfig, skin } })
      }
      return Promise.resolve(edgeResult('wavedrom', VERSION, serializeOnml(renderAny(0, specification, skins))))
    } catch (error) {
      return edgeFailure('wavedrom', error)
    }
  },
}
