import assert from 'node:assert/strict'
import test from 'node:test'
import { mobilePanelSwitchState } from '../src/mobile-panel.js'

test('points the mobile panel switch at the hidden workspace panel', () => {
  assert.deepEqual(mobilePanelSwitchState('editor'), {
    panel: 'editor',
    targetPanel: 'preview',
    controls: 'preview-panel',
    label: 'Show preview',
  })
  assert.deepEqual(mobilePanelSwitchState('preview'), {
    panel: 'preview',
    targetPanel: 'editor',
    controls: 'editor-panel',
    label: 'Show editor',
  })
})

test('defaults an unknown mobile panel to the editor', () => {
  assert.equal(mobilePanelSwitchState('unknown').panel, 'editor')
})
