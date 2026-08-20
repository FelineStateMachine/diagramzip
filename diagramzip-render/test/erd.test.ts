import { describe, expect, it } from 'vitest'
import { ErdSyntaxError, erdToDot, parseErd } from '../src/erd'

describe('ERD source lowering', () => {
  it('parses the repository schema and emits entities, fields, and cardinalities', () => {
    const doc = parseErd(`[Person]\n*name\nheight\nweight\n+birth_location_id\n\n[Location]\n*id\ncity\nstate\ncountry\n\nPerson *--1 Location`)
    expect(doc.entities).toHaveLength(2)
    expect(doc.entities[0]!.attributes[0]).toMatchObject({ field: 'name', pk: true, fk: false })
    expect(doc.entities[0]!.attributes[3]).toMatchObject({ field: 'birth_location_id', pk: false, fk: true })
    expect(doc.relations[0]).toMatchObject({ entity1: 'Person', entity2: 'Location', card1: 'zero-plus', card2: 'one' })
    const dot = erdToDot(doc)
    expect(dot).toContain('"Person" [label=<')
    expect(dot).toContain('taillabel=<0..N>')
    expect(dot).toContain('headlabel=<1>')
  })

  it('supports quoted identifiers, comments, directives, labels, and all cardinalities', () => {
    const doc = parseErd(`# comment\ntitle { label: "People & places", size: "24" }\nheader { label: "header", color: "navy", font: "Georgia", size: "18" }\nentity { bgcolor: "#fff", border: "2", border-color: "red", cellborder: "1", cellspacing: "2", cellpadding: "3", color: "black", font: "Arial", size: "11" }\nrelationship { label: "lives at", color: "gray", font: "Arial", size: "10" }\n\n["People & Co"]\n*"display name" { label: "Name", color: "blue", font: "Verdana", size: "9", text-alignment: "center" }\n[Place]\n?code\n\n"People & Co" ?--+ Place # trailing comment`)
    expect(doc.titleOptions).toContainEqual({ name: 'label', value: 'People & places' })
    expect(doc.relations[0]).toMatchObject({ card1: 'zero-one', card2: 'one-plus' })
    const dot = erdToDot(doc)
    expect(dot).toContain('People &amp; places')
    expect(dot).toContain('People &amp; Co')
    expect(dot).toContain('{0,1}')
    expect(dot).toContain('headlabel=<')
    expect(dot).toContain('BGCOLOR="#fff"')
    expect(dot).toContain('COLOR="red"')
    expect(dot).toContain('POINT-SIZE="10"')
    expect(dot).toContain(' [Name]')
    expect(dot).toContain('graph [label=<<FONT POINT-SIZE="24">People &amp; places</FONT>>, labelloc=t, labeljust=l];')
  })

  it('retains upstream defaults when a global directive overrides one property', () => {
    const dot = erdToDot(parseErd('header { color: "navy" }\nentity { bgcolor: "#fff" }\n[A]\nid'))
    expect(dot).toContain('POINT-SIZE="16"')
    expect(dot).toContain('FACE="Helvetica"')
    expect(dot).toContain('CELLBORDER="1"')
    expect(dot).toContain('CELLPADDING="4"')
  })

  it('supports upstream multiline options, comments, and trailing commas', () => {
    const doc = parseErd(`entity {
      bgcolor: "#ececfc", # preserve the upstream comment form
      size: "20",
    }
    [Person]
    name {
      label: "string",
      color: "#3366ff",
    }`)
    const dot = erdToDot(doc)
    expect(dot).toContain('BGCOLOR="#ececfc"')
    expect(dot).toContain('POINT-SIZE="20"')
    expect(dot).toContain('COLOR="#3366ff"')
    expect(dot).toContain(' [string]')
  })

  it('treats directive names after the preamble as ordinary attributes', () => {
    const doc = parseErd('[A]\nid\nheader { color: "red" }\n[B]\nid')
    expect(doc.headerOptions).toEqual([])
    expect(doc.entities[0]!.attributes[1]).toMatchObject({ field: 'header' })
    expect(erdToDot(doc)).toContain('<FONT COLOR="red">header</FONT>')
  })

  it('escapes DOT and HTML metacharacters in labels', () => {
    const dot = erdToDot(parseErd('["A]\\B"]\n"x < y & z"'))
    expect(dot).toContain('"A]\\\\B"')
    expect(dot).toContain('x &lt; y &amp; z')
  })

  it('applies supported HTML table styling to attributes', () => {
    const dot = erdToDot(parseErd('[A]\nfield { bgcolor: "#ececfc", border: "2", border-color: "red", cellborder: "3", cellspacing: "4", cellpadding: "5" }'))
    expect(dot).toContain('BGCOLOR="#ececfc"')
    expect(dot).toContain('BORDER="2"')
    expect(dot).toContain('COLOR="red"')
    expect(dot).toContain('CELLBORDER="3"')
    expect(dot).toContain('CELLSPACING="4"')
    expect(dot).toContain('CELLPADDING="5"')
  })

  it('rejects malformed input and filesystem-style configuration', () => {
    expect(() => parseErd('id')).toThrow(/attribute comes before first entity/)
    expect(() => parseErd('[A]\nfield { config: "/tmp/erd.yaml" }')).toThrow(/option 'config' does not exist/)
    expect(() => parseErd('[A]\nfoo\nA *--1 Missing')).toThrow(/unknown entity 'Missing'/)
    expect(() => parseErd('[A]\nfoo { label: "unterminated }')).toThrow(ErdSyntaxError)
    expect(() => parseErd('[A]\nfoo { border: "256" }')).toThrow(/0 to 255/)
    expect(() => parseErd('[A]\nfoo { size: "0" }')).toThrow(/positive finite/)
    expect(() => parseErd('[A]\nfoo { text-alignment: "diagonal" }')).toThrow(/text-alignment/)
    expect(() => parseErd('[A]\nfoo { color: "red"')).toThrow(/unterminated options/)
  })
})
