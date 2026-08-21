import { createRendererUnitGroup } from '../unit'
import { vegaDescriptor } from './vega'
import { vegaliteDescriptor } from './vegalite'

export default createRendererUnitGroup('vega-family', [vegaDescriptor, vegaliteDescriptor])
