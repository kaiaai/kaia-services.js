import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/kaia-services.ts',
  plugins: [typescript()],
  output: [{
    file: 'dist/kaia-services-iife.js',
    format: 'iife',
    name: 'kaiaServicesJs'
  }, {
    file: 'dist/kaia-services-cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/kaia-services.mjs',
    format: 'es'
  }, {
    file: 'dist/kaia-services-amd.js',
    format: 'amd',
  }]
};
