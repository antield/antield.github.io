import path from 'path';

export default {
  output: {
    filename: '[name].bundle.js',
    //path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader'
      ]
    }, {
      test: /\.(jpg|png|gif)$/,
      use: [
        'url-loader'
      ]
    }, {
      test: /\.svg$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }]
    }, {
      // 增加对 SCSS 文件的支持
      test: /\.scss$/,
      // SCSS 文件的处理顺序为先 sass-loader 再 css-loader 再 style-loader
      use: ['style-loader', 'css-loader', 'sass-loader'],
    }, ]
  }
};
