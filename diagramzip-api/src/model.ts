export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface Diagram {
  type: string
  source: string
  options: { [key: string]: JsonValue }
  presentation: {
    background: string
    padding: number
    frame: boolean
  }
}

export interface AliasMetadata {
  title: string
  description: string
}

export interface OpenAliasInput {
  mode: 'open'
  diagram: Diagram
  metadata: AliasMetadata
}

export interface EncryptedBlob {
  v: 1
  alg: 'A256GCM'
  iv: string
  ciphertext: string
}

export interface KeyEnvelope {
  v: 1
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
  }
  wrap: EncryptedBlob
}

export interface LockedAliasInput {
  mode: 'locked'
  encryptedContent: EncryptedBlob
  encryptedMetadata: EncryptedBlob
  keyEnvelope: KeyEnvelope
}

export type AliasInput = OpenAliasInput | LockedAliasInput

export interface AliasRecord {
  alias_id: string
  content_id: string
  render_id: string
  object_key: string
  revision: number
  mode: 'open' | 'locked'
  title: string | null
  description: string | null
  encrypted_metadata: string | null
  key_envelope: string | null
  write_key_hash: ArrayBuffer
  created_at: number
  updated_at: number
}

export interface OpenAliasResponse {
  aliasId: string
  contentId: string
  renderId: string
  revision: number
  mode: 'open'
  metadata: AliasMetadata
  diagram: Diagram
  createdAt: number
  updatedAt: number
}

export interface LockedAliasResponse {
  aliasId: string
  contentId: string
  renderId: string
  revision: number
  mode: 'locked'
  encryptedContent: EncryptedBlob
  encryptedMetadata: EncryptedBlob
  keyEnvelope: KeyEnvelope
  createdAt: number
  updatedAt: number
}

export type AliasResponse = OpenAliasResponse | LockedAliasResponse
