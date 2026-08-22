export function mobilePanelSwitchState(panel) {
  const currentPanel = panel === 'preview' ? 'preview' : 'editor'
  const targetPanel = currentPanel === 'editor' ? 'preview' : 'editor'
  return {
    panel: currentPanel,
    targetPanel,
    controls: `${targetPanel}-panel`,
    label: targetPanel === 'preview' ? 'Show preview' : 'Show editor',
  }
}
