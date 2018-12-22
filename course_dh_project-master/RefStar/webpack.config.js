const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/dev/index.js',
  output: {
    path: path.join(__dirname, 'src/dist/'),
    filename: 'bundle.js',
  },
  plugins: [new HtmlWebpackPlugin({
      template: './src/dev/HomePage.html',
      filename: 'HomePage.html',
      inject: 'body',
    }
  )],
  devtool: 'eval',
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: { module: true }
          }
        ]
      },
    ],
  }
}
