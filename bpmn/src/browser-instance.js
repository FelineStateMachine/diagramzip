import puppeteer from 'puppeteer'
import { createBrowserInstance } from '@diagramzip/browser-instance'

import { logger } from './logger.js'

export const { getBrowserWSEndpoint, protocolTimeout } = createBrowserInstance({
  puppeteer,
  logger,
  envPrefix: 'KROKI_BPMN'
})
