---
"@yugasun/dsh-web-search": patch
---

Use `ctx.settings.installSection` so the plugin boots on DSH 0.1.5+, where `installSettingsSection` is no longer a package export.
