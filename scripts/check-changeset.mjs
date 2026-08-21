import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const CHANGESET_FILE = /^\.changeset\/(?!README\.md$)[^/]+\.md$/

export function classifyChangesetRequirement({
  changedFiles,
  packageDirs,
  headRef,
  headRepository,
  repository,
}) {
  if (
    headRef === 'changeset-release/main'
    && headRepository
    && repository
    && headRepository === repository
  ) {
    return { required: false, reason: 'generated release pull request' }
  }

  const changedPackages = [...new Set(
    changedFiles.flatMap((file) => {
      const match = /^packages\/([^/]+)\//.exec(file)
      return match && packageDirs.has(match[1]) ? [match[1]] : []
    }),
  )].sort()

  if (changedPackages.length === 0) {
    return { required: false, reason: 'no publishable package changed' }
  }

  return {
    required: true,
    hasChangeset: changedFiles.some((file) => CHANGESET_FILE.test(file)),
    changedPackages,
  }
}

function findPublishablePackageDirs() {
  return new Set(
    readdirSync('packages', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => {
        const manifest = `packages/${entry.name}/package.json`
        return existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).private !== true
      })
      .map((entry) => entry.name),
  )
}

function main() {
  const baseRef = `origin/${process.env.GITHUB_BASE_REF || 'main'}`
  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMRD', `${baseRef}...HEAD`],
    { encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean)

  const result = classifyChangesetRequirement({
    changedFiles,
    packageDirs: findPublishablePackageDirs(),
    headRef: process.env.GITHUB_HEAD_REF || '',
    headRepository: process.env.RELEASE_HEAD_REPOSITORY || '',
    repository: process.env.RELEASE_BASE_REPOSITORY || '',
  })

  if (!result.required) {
    console.log(`Changeset check skipped: ${result.reason}.`)
    return
  }

  if (!result.hasChangeset) {
    throw new Error(
      `Changes to ${result.changedPackages.join(', ')} require "pnpm changeset" `
      + 'or "pnpm changeset --empty".',
    )
  }

  execFileSync('pnpm', ['exec', 'changeset', 'status', '--since', baseRef], {
    stdio: 'inherit',
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
