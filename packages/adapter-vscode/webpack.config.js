//@ts-check
'use strict';

const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    // Packaged beside the extension as vendor/sql.js (see scripts/stage-sqljs.js).
    // From dist/extension.js this resolves to ../vendor/sql.js.
    'sql.js': 'commonjs ../vendor/sql.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{ test: /\.ts$/, exclude: /node_modules/, use: [{ loader: 'ts-loader' }] }]
  }
};
