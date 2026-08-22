export interface TikzCore {
  load(fetchAsset: (assetPath: string) => Promise<Response>): Promise<void>
  texify(source: string, options: Record<string, string>): Promise<string>
}
export const tikzCore: TikzCore
