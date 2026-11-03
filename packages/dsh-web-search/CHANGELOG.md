# @yugasun/dsh-web-search

## 0.2.6

### Patch Changes

- ecd36aa: Support DeepSeek Harness 0.2.1-rc.5 and upgrade SearchSuite to 0.2.0, which requires Node.js 24 or newer.
  
  Migrate settings to live plugin configuration and the rc.5 configForms client API; update web provider selection to volatile references.

## 0.2.5

### Patch Changes

- 27de0b3: Route custom web searches through the shared `searchsuite` SDK while preserving the plugin's provider selection, credentials, failover, and page extraction behavior.
