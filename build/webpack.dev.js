const common = require('./webpack.common')
const path = require('path')
const { merge } = require('webpack-merge')

module.exports = merge(common, {
  mode: 'development',
  entry: {
    index: path.join(__dirname, '../src/index.js')
  },
  output: {
    filename: 'sim.js',
    path: path.resolve(__dirname, '../dist'),
    library: 'Sim',
    libraryTarget: 'window'
  },
  optimization: {
    minimize: false
  },
  devtool: 'eval-source-map'
})
