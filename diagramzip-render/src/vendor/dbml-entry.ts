import { run } from '@softwaretechnik/dbml-renderer'

export function dbmlToDot(source: string): string {
  return run(source, 'dot')
}
