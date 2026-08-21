import 'monaco-editor/languages/definitions/clojure/register.js'
import 'monaco-editor/languages/definitions/sql/register.js'
import 'monaco-editor/languages/definitions/xml/register.js'
import 'monaco-editor/languages/definitions/yaml/register.js'
import { jsonDefaults } from 'monaco-editor/language/json/monaco.contribution.js'
import {
  DETAILS_DOCUMENT_SCHEMA,
  DETAILS_MODEL_URI,
  DETAILS_SCHEMA_URI,
} from '../details-document.js'
import { GENERIC_LANGUAGE_ID, JSON5_LANGUAGE_ID } from '../editor-languages.js'

const keywords = [
  'actor', 'alt', 'and', 'as', 'class', 'component', 'database', 'direction', 'else', 'end',
  'endnote', 'endif', 'endwhile', 'flowchart', 'graph', 'group', 'if', 'interface', 'loop',
  'namespace', 'node', 'note', 'package', 'participant', 'rectangle', 'return', 'skinparam',
  'start', 'state', 'stop', 'subgraph', 'then', 'title', 'while',
]

let registered = false

export function registerMonacoLanguages(monaco) {
  if (registered) return
  registered = true

  jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{
      uri: DETAILS_SCHEMA_URI,
      fileMatch: [DETAILS_MODEL_URI],
      schema: DETAILS_DOCUMENT_SCHEMA,
    }],
    enableSchemaRequest: false,
    schemaRequest: 'ignore',
    schemaValidation: 'error',
    comments: 'error',
    trailingCommas: 'error',
  })

  monaco.languages.register({ id: GENERIC_LANGUAGE_ID })
  monaco.languages.setMonarchTokensProvider(GENERIC_LANGUAGE_ID, {
    defaultToken: '',
    ignoreCase: true,
    keywords,
    tokenizer: {
      root: [
        [/\/\*/, 'comment', '@blockComment'],
        [/^\s*(?:%%|\/\/|'|#).*$/, 'comment'],
        [/@(?:start|end)[a-z0-9_]*/i, 'keyword'],
        [/"/, 'string', '@doubleQuotedString'],
        [/(?:--?>|<--?|==>|<==|\.\.>|<\.\.|->|<-|=>|<=|--|\.\.)/, 'operator'],
        [/#[0-9a-f]{3,8}\b/i, 'number.hex'],
        [/\b\d+(?:\.\d+)?\b/, 'number'],
        [/[a-z_][\w-]*/i, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
      ],
      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      doubleQuotedString: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })

  monaco.languages.register({ id: JSON5_LANGUAGE_ID })
  monaco.languages.setLanguageConfiguration(JSON5_LANGUAGE_ID, {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
  })
  monaco.languages.setMonarchTokensProvider(JSON5_LANGUAGE_ID, {
    defaultToken: '',
    keywords: ['true', 'false', 'null', 'Infinity', 'NaN'],
    tokenizer: {
      root: [
        [/\/\*/, 'comment', '@blockComment'],
        [/\/\/.*$/, 'comment'],
        [/"/, 'string', '@doubleQuotedString'],
        [/'/, 'string', '@singleQuotedString'],
        [/-?0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/, 'number'],
        [/[a-z_$][\w$-]*/i, { cases: { '@keywords': 'keyword', '@default': 'key' } }],
        [/[{}\[\](),.:]/, 'delimiter'],
      ],
      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      doubleQuotedString: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      singleQuotedString: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  })
}
