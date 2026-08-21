const base = process.env.PLANTUML_WORKER_URL ?? 'http://127.0.0.1:18790'

async function render(host, source, options = {}) {
  const response = await fetch(`${base.replace('127.0.0.1', `${host}.localhost`)}/v1/svg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, options }),
  })
  const body = await response.text()
  if (!response.ok || !body.includes('<svg') || /Syntax Error\?|Error line \d+/i.test(body)) throw new Error(`${host}: ${response.status} ${body.slice(0, 300)}`)
  return body
}

const sequence = '@startuml\nAlice -> Bob: hello\n@enduml'
const classDiagram = '@startuml\nclass Foo\nclass Bar\nFoo --> Bar\n@enduml'
const c4 = '@startuml\n!include <C4/C4_Context>\nPerson(alice, "Alice")\nSystem(app, "App")\nRel(alice, app, "uses")\n@enduml'

const [sequenceA, sequenceB, classSvg, c4Svg] = await Promise.all([
  render('plantuml', sequence), render('plantuml', sequence), render('plantuml', classDiagram), render('c4plantuml', c4),
])
if (sequenceA !== sequenceB) throw new Error('serialized repeated renders were not deterministic')
if (!classSvg.includes('Foo') || !classSvg.includes('Bar')) throw new Error('class labels missing')
if (!c4Svg.includes('Alice') || !c4Svg.includes('#1168BD')) throw new Error('C4 lowering did not affect output')
await render('plantuml', sequence, { theme: 'plain', 'no-metadata': '' })
console.log('PlantUML family workerd smoke passed')
