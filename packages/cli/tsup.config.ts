import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  // ESM needs the shebang as a banner so `#!/usr/bin/env node` lands at file top.
  banner: {
    js: '#!/usr/bin/env node',
  },
  // keep dynamic requires (electron path lookup) working under ESM
  shims: false,
})
