const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      '__VERSION__': JSON.stringify(require('../package.json').version)
    })
  ],
  resolve: {
    extensions: ['.js', '.json']
  }
}
