// jscs:disable
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import npm from 'rollup-plugin-npm';

export default {
  entry: 'src/column-view.js',
  format: 'iife',
  plugins: [ npm({
      jsnext: true,
      main: true
    }), commonjs({
      include: 'node_modules/**',
    }), babel({
    "presets": ["es2015-rollup"]
    })
  ],
  dest: 'dist/bundle.js',
  moduleName: 'ColumnView',
  sourceMap: true
};
