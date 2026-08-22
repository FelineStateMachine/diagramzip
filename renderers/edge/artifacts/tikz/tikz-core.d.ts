export interface TikzCore {
  load(baseUrl: string): Promise<void>
  texify(source: string, options: Record<string, string>): Promise<string>
}
export const tikzCore: TikzCore
