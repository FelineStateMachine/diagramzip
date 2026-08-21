import { describe, expect, it } from 'vitest'
import { lowerStructurizr, parseStructurizr } from '../src/structurizr'
import awsSource from '../../server/src/test/resources/aws.structurizr?raw'
import bigbankSource from '../../server/src/test/resources/bigbank.structurizr?raw'
import docsSource from '../../server/src/test/resources/docs.structurizr?raw'
import gettingStartedSource from '../../server/src/test/resources/gettingstarted.structurizr?raw'
import scriptSource from '../../server/src/test/resources/script.structurizr?raw'

const fixtures = {
  'aws.structurizr': awsSource,
  'bigbank.structurizr': bigbankSource,
  'docs.structurizr': docsSource,
  'gettingstarted.structurizr': gettingStartedSource,
  'script.structurizr': scriptSource,
}
const fixture = (name: keyof typeof fixtures) => fixtures[name]

describe('bounded Structurizr lowering', () => {
  it('covers the gettingstarted and bigbank view families', () => {
    const gettingStarted = parseStructurizr(fixture('gettingstarted.structurizr'))
    expect(gettingStarted.views).toHaveLength(1)
    expect(lowerStructurizr(gettingStarted, {})).toContain('@startuml')

    const bigbank = parseStructurizr(fixture('bigbank.structurizr'))
    expect(bigbank.views.map(view => view.key)).toEqual(expect.arrayContaining([
      'SystemLandscape', 'SystemContext', 'Containers', 'Components', 'SignIn', 'DevelopmentDeployment', 'LiveDeployment',
    ]))
    expect(lowerStructurizr(bigbank, { 'view-key': 'Components' })).toContain('s_signinController')
    expect(lowerStructurizr(bigbank, { 'view-key': 'Components' })).toContain('Sign In Controller')
    expect(lowerStructurizr(bigbank, { 'view-key': 'SystemContext' })).not.toContain('s_signinController')
    expect(lowerStructurizr(bigbank, { 'view-key': 'Containers' })).not.toContain('s_signinController')
    expect(lowerStructurizr(bigbank, { 'view-key': 'Containers' })).toContain('s_singlePageApplication')
    const development = lowerStructurizr(bigbank, { 'view-key': 'DevelopmentDeployment' })
    expect(development).not.toContain('Failover')
    expect(lowerStructurizr(bigbank, { 'view-key': 'LiveDeployment' })).toContain('Failover')
    expect(lowerStructurizr(bigbank, { output: 'legend' })).toContain('endlegend')
  })

  it('preserves deployment ownership and rejects unsafe directives/themes', () => {
    const aws = parseStructurizr(fixture('aws.structurizr'))
    expect(aws.elements.find(element => element.id === 'route53')?.parent).toBe('region')
    expect(() => parseStructurizr(fixture('script.structurizr'))).toThrow(/directive.*!script/i)
    expect(() => parseStructurizr(fixture('docs.structurizr'))).toThrow(/directive.*!docs/i)
    expect(() => parseStructurizr(`workspace "x" {
model {
  a = softwareSystem "A"
}
views {
  systemLandscape {
    include *
  }
  theme https://evil.example/theme.json
}
}`)).toThrow(/theme/i)
  })

  it('does not interpolate hostile tags into PlantUML stereotypes', () => {
    const source = `workspace "x" {
model {
 a = softwareSystem "A" "" "" "bad>>tag"
}
views {
 systemLandscape {
  include *
 }
}
}`
    const output = lowerStructurizr(parseStructurizr(source), {})
    expect(output).not.toContain('bad>>tag')
    expect(output).not.toContain('<<bad')
    expect(() => parseStructurizr(source.replace('views {', 'styles { element "Person" { color #fff; } }\nviews {'))).toThrow()
  })
})
