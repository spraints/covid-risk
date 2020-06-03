import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'assets/app.js',
  output: {
    file: 'public/assets/app.js',
    format: 'iife',
    sourcemap: true
  },
  treeshake: true,
  plugins: [
    // common({include: [ 'node_modules/$mod/**' ],
    typescript(),
    resolve(),
    commonjs()
  ]
}
