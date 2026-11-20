export interface NetworkInformation extends EventTarget {
  saveData?: boolean
  effectiveType?: string
}
export function shouldPlayBackgroundVideo(connection?: Pick<NetworkInformation, 'saveData' | 'effectiveType'>): boolean {
  return !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
}
