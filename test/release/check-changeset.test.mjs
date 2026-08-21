import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyChangesetRequirement } from '../../scripts/check-changeset.mjs'

const packageDirs = new Set(['dsh-web-search', 'another-plugin'])

test('does not require a changeset for repository-only changes', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: ['README.md', '.github/workflows/ci.yml'],
      packageDirs,
      headRef: 'feature/docs',
    }),
    { required: false, reason: 'no publishable package changed' },
  )
})

test('requires a changeset when a public package changes', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: ['packages/dsh-web-search/src/index.ts'],
      packageDirs,
      headRef: 'feature/search',
    }),
    { required: true, hasChangeset: false, changedPackages: ['dsh-web-search'] },
  )
})

test('accepts a changeset file', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: [
        'packages/another-plugin/src/index.ts',
        '.changeset/calm-rivers-smile.md',
      ],
      packageDirs,
      headRef: 'feature/plugin',
    }),
    { required: true, hasChangeset: true, changedPackages: ['another-plugin'] },
  )
})

test('ignores Changesets config and README as release intent', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: [
        'packages/dsh-web-search/package.json',
        '.changeset/config.json',
        '.changeset/README.md',
      ],
      packageDirs,
      headRef: 'feature/config',
    }),
    { required: true, hasChangeset: false, changedPackages: ['dsh-web-search'] },
  )
})

test('exempts the generated Version Packages PR', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: ['packages/dsh-web-search/package.json'],
      packageDirs,
      headRef: 'changeset-release/main',
      headRepository: 'yugasun/dsh-plugins',
      repository: 'yugasun/dsh-plugins',
    }),
    { required: false, reason: 'generated release pull request' },
  )
})

test('does not exempt a fork branch named changeset-release/main', () => {
  assert.deepEqual(
    classifyChangesetRequirement({
      changedFiles: ['packages/dsh-web-search/package.json'],
      packageDirs,
      headRef: 'changeset-release/main',
      headRepository: 'contributor/dsh-plugins',
      repository: 'yugasun/dsh-plugins',
    }),
    { required: true, hasChangeset: false, changedPackages: ['dsh-web-search'] },
  )
})
