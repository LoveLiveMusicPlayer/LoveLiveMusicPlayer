/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import webpackPaths from './webpack.paths.js';
import {dependencies as externals} from '../../build/app/package.json';

export default {
  externals: [...Object.keys(externals || {})],

  module: {
    rules: [
        {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                },
            },
        },
        {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
        },
        {
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
        }
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    fallback: {
      // "path": require.resolve("path-browserify"),
      "fs": false
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({
        NODE_ENV: 'production',
    })
  ],
};
