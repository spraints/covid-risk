import typescript from '@rollup/plugin-typescript'

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
    typescript()
  ]
}
