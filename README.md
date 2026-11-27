<p><img src="https://raw.githubusercontent.com/sushidev-team/renzu-extension-sdk/main/.github/assets/renzu.png" width="64" height="64" alt="Renzu" /></p>

# Renzu Extension SDK

Standalone manifest types, JSON Schema and authoring tools. The Renzu desktop application and backend are not included.

```ts
import {defineExtension, validateManifest} from '@renzu/extension-sdk';
```

```sh
renzu-extension init my-cockpit.manifest.json
renzu-extension validate my-cockpit.manifest.json
renzu-extension build my-cockpit.manifest.json --out my-cockpit-0.1.0.json
```

`init` and `build` never overwrite an existing output file. Validation does not need a cluster, a Renzu vault or account credentials. The CLI prints only extension ID, version and a file digest. A file digest is distinct from the installed app's canonical permission digest.

Use `@renzu/extension-sdk/schema.json` in your editor to associate a JSON file with the manifest schema. Do not add a `$schema` field to an installed manifest: the native host rejects unknown fields. The app always validates again and requests concrete cluster/namespace grants.

Version 1 supports metadata queries and declarative widgets. It cannot run arbitrary React, shell, npm or WASM code in Renzu. A separate isolated runtime is required for a future executable UI format.

The native app is the final security boundary; the SDK's checks are authoring assistance. Package scope and license are pending confirmation before first publication.
