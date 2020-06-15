import path from 'path'
import {createHash} from 'crypto'
import {mkdirSync, writeFileSync} from 'fs'

import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const hash = {
  name: 'hash-name',
  async generateBundle(opts, bundles) {
    const {sourcemap, file} = opts
    opts.sourcemap = false
    const dir = path.dirname(file)
    mkdirSync(dir, {recursive: true})
    for (const filename in bundles) {
      const bundle = bundles[filename]
      const sha256 = createHash('sha256')
      const hash = sha256.update(bundle.code).digest('hex').substr(0, 10)
      bundle.fileName = `${bundle.name}-${hash}${path.extname(filename)}`
      if (sourcemap) {
        const mapFile = `${bundle.name}-${hash}.js.map`
        const mapPath = path.join(dir, mapFile)
        bundle.code += `//# sourceMappingURL=${mapFile}\n`
        writeFileSync(mapPath, bundle.map.toString())
      }
    }
  }
}

export default {
  input: 'assets/app.js',
  output: {
    file: 'public/assets/app.js',
    format: 'iife',
    sourcemap: true
  },
  treeshake: true,
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    hash
  ]
}
