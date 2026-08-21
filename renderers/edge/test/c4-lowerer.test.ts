import { describe, expect, it } from 'vitest'
import { lowerC4 } from '../src/adapters/c4-lowerer'

describe('C4 bounded lowering', () => {
  it('preserves entity semantics, relationships, technology, and local include aliases', () => {
    const lowered = lowerC4(`@startuml
!include C4_Context.puml
Person_Ext(user, "User")
System_Ext(mail, "Mail service")
System(app, "App")
Rel_Back(app, mail, "sends", "SMTP")
Rel_Neighbor(user, app, "uses")
SHOW_LEGEND()
@enduml`)

    expect(lowered).toContain('person "User" as user')
    expect(lowered).toContain('#686868')
    expect(lowered).toContain('rectangle "Mail service" as mail')
    expect(lowered).toContain('#999999')
    expect(lowered).toContain('app <-- mail : sends [SMTP]')
    expect(lowered).toContain('user .. app : uses')
    expect(lowered).toContain('C4-PlantUML')
    expect(lowered).not.toContain('!include')
  })

  it('rejects unknown C4-shaped calls rather than passing broken source through', () => {
    expect(() => lowerC4('@startuml\nUnknownC4Macro(foo)\n@enduml')).toThrow(/Unsupported C4 macro/)
  })

  it('bounds aliases, tags, and multiline text before generating PlantUML', () => {
    expect(() => lowerC4('@startuml\nSystem(bad-alias, "App")\n@enduml')).toThrow(/invalid alias/)
    expect(() => lowerC4('@startuml\nSystem(app, "App", "", "", "bad>>tag")\n@enduml')).toThrow(/C4 tags/)
    expect(lowerC4('@startuml\nSystem(app, "First\\nSecond")\n@enduml')).toContain('"First\\nSecond" as app')
  })

  it('keeps container and component technology, descriptions, and tags in their C4 argument positions', () => {
    const lowered = lowerC4('@startuml\nContainer(api, "API", "Node.js", "Serves calls", "", "backend")\n@enduml')
    expect(lowered).toContain('"API\\n[Node.js]\\n[Serves calls]" as api')
    expect(lowered).toContain('<<c4-container,backend>>')
  })
})
