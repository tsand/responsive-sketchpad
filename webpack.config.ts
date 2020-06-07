import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  entry: './src/sketchpad.ts',
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sketchpad.js',
    libraryExport: 'default',
    libraryTarget: 'umd',
    library: {
        root: 'Sketchpad',
        amd: 'responsive-sketchpad',
        commonjs: 'responsive-sketchpad',
    },
  },
};

export default config
