PRAGMA foreign_keys = ON;

CREATE TABLE contents (
  content_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('open', 'locked')),
  object_key TEXT NOT NULL UNIQUE,
  encoding TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  created_at INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE aliases (
  alias_id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES contents(content_id),
  render_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  mode TEXT NOT NULL CHECK (mode IN ('open', 'locked')),
  title TEXT,
  description TEXT,
  encrypted_metadata TEXT,
  key_envelope TEXT,
  write_key_hash BLOB NOT NULL CHECK (length(write_key_hash) = 32),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (mode = 'open' AND encrypted_metadata IS NULL AND key_envelope IS NULL)
    OR
    (mode = 'locked' AND title IS NULL AND description IS NULL
      AND encrypted_metadata IS NOT NULL AND key_envelope IS NOT NULL)
  )
) WITHOUT ROWID;

CREATE INDEX aliases_by_content ON aliases(content_id);
CREATE INDEX aliases_by_render ON aliases(render_id);
