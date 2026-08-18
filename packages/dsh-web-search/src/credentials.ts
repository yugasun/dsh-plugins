import { SECRET_ENVS, type ResolvedSecrets } from './select.ts'

export interface CredentialHit {
  value?: string
}

export interface Credentials {
  resolve?(ref: string): Promise<CredentialHit | undefined>
}

export async function credentialOverlay(credentials: Credentials | undefined): Promise<Partial<ResolvedSecrets>> {
  if (credentials?.resolve == null) return {}
  const overlay: Partial<ResolvedSecrets> = {}
  for (const field of Object.keys(SECRET_ENVS) as Array<keyof ResolvedSecrets>) {
    for (const name of SECRET_ENVS[field]) {
      try {
        const hit = await credentials.resolve(name)
        const value = hit?.value?.trim() ?? ''
        if (value.length > 0) {
          overlay[field] = value
          break
        }
      } catch {
        // Missing service or a non-POSIX ref; keep looking.
      }
    }
  }
  return overlay
}
