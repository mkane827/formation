// -----------------------------------------------------------------------------
// ----- Webpack Configuration -------------------------------------------------
// -----------------------------------------------------------------------------
'use strict';

const autoprefixer = require('autoprefixer');
const bourbon = require('bourbon');
const bourbonNeat = require('bourbon-neat');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const formationJson = require('@darkobits/formation/package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const packageJson = require('./package.json');
const resolve = require('path').resolve;
const SassLintPlugin = require('sasslint-webpack-plugin');
const VisualizerWebpackPlugin = require('webpack-visualizer-plugin');
const webpack = require('webpack');

const CONTEXT = resolve(__dirname, 'src');
const MODULE_NAME = packageJson.name;
const VERSION = packageJson.version;

const extractSass = new ExtractTextWebpackPlugin({
  filename: '[name].[contenthash].css',
  allChunks: true
  // disable: process.env.NODE_ENV === "development"
});


module.exports = env => {
  const config = {};


  // ----- Core ----------------------------------------------------------------

  // Set the root for compilation. All other file names and paths are assumed to
  // be relative to this.
  config.context = CONTEXT;


  config.entry = {
    index: resolve(CONTEXT, 'index.js'),
    vendor: Object.keys(packageJson.dependencies)
  };


  // Configure output.
  config.output = {
    // Output directory.
    path: resolve(__dirname, 'dist'),
    // Output each file using the bundle name and a content-based hash.
    filename: '[name]-[chunkhash].js',
    sourceMapFilename: '[file]-[chunkhash].map',
    publicPath: '/formation/'
  };


  // ----- Loaders -------------------------------------------------------------

  config.module = {
    rules: []
  };


  // JavaScript: Lint source and emit errors to the browser console/terminal.
  config.module.rules.push({
    enforce: 'pre',
    test: /\.(m)?js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'xo-loader',
        options: {
          // Exit on error when compiling.
          failOnError: env.dist
        }
      }
    ]
  });


  // JavaScript: Transpile and annotate.
  config.module.rules.push({
    test: /\.(m)?js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'ng-annotate-loader',
        options: {
          add: true
        }
      },
      {
        loader: 'babel-loader'
      }
    ]
  });


  // Sass: Compile, add PostCSS transforms, emit to ExtractText.
  config.module.rules.push({
    test: /\.(c|sc|sa)ss$/,
    use: extractSass.extract({
      use: [
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            minimize: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            plugins () {
              return [
                autoprefixer
              ];
            }
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            includePaths: [
              CONTEXT,
              resolve(CONTEXT, 'etc', 'style'),
              'node_modules'
            ]
            .concat(bourbon.includePaths)
            .concat(bourbonNeat.includePaths)
          }
        }
      ]
    })
  });


  // Static assets: Inline anything under 10k, otherwise emit a file in the
  // output directory and return a URL pointing to it.
  config.module.rules.push({
    test: /\.(png|jpg|gif|eot|ttf|woff|woff2)$/,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  });


  config.module.rules.push({
    test: /\.svg$/,
    use: [
      {
        loader: 'svg-sprite-loader'
      }
    ]
  });


  // HTML (templates): Add to the Angular Template Cache and return a URL
  // pointing to the template.
  config.module.rules.push({
    test: /\.html$/,
    exclude: [
      resolve(CONTEXT, 'index.html')
    ],
    use: [
      {
        loader: 'ngtemplate-loader',
        options: {
          requireAngular: true,
          relativeTo: CONTEXT,
          prefix: MODULE_NAME
        }
      },
      {
        loader: 'html-loader'
      }
    ]
  });


  // ----- Module Resolving ----------------------------------------------------

  config.resolve = {
    modules: [
      CONTEXT,
      'node_modules'
    ]
  };


  // ----- Plugins -------------------------------------------------------------

  config.plugins = [];


  // Configure source map plugin.
  config.plugins.push(new webpack.SourceMapDevToolPlugin({
    filename: '[file].map'
  }));


  // Responsible for managing index.html and injecting references to bundles.
  config.plugins.push(new HtmlWebpackPlugin({
    template: resolve(CONTEXT, 'index.html'),
    chunksSortMode: 'dependency',
    showErrors: true
  }));


  config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor'
  }));


  // Responsible for extracting the CSS in the bundle into a separate file.
  config.plugins.push(extractSass);


  // Lint Sass during compilation.
  if (env.local) {
    config.plugins.push(new SassLintPlugin({
      failOnError: false,
      failOnWarning: false,
      ignorePlugins: ['extract-text-webpack-plugin', 'html-webpack-plugin']
    }));
  }


  // Define variables that will be available throughout the bundle. Webpack will
  // replace the reference to the variable with its value (hence the double
  // quotes) which will allow UglifyJS to completely remove unused blocks when
  // compiling.
  config.plugins.push(new webpack.DefinePlugin({
    // This is here to support Node conventions. Use webpack.ENV in app code.
    process: {
      'env.NODE_ENV': env.dist ? '"production"' : '"development"'
    },
    webpack: {
      // Expose name from package.json.
      MODULE_NAME: `"${MODULE_NAME}"`,
      // Expose version from package.json.
      VERSION: `"${VERSION}"`,
      FORMATION_VERSION: `"${formationJson.version}"`,
      // Define build environment.
      ENV: env.dist ? '"dist"' : env.test ? '"test"' : '"local"'
    }
  }));


  if (env.stats) {
    // Generates statistics about what contributes to bundle size.
    config.plugins.push(new VisualizerWebpackPlugin({
      filename: resolve(CONTEXT, 'stats/index.html')
    }));
  }


  if (env.dist) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        dead_code: true // eslint-disable-line camelcase
      },
      mangle: true,
      output: {
        comments: false
      }
    }));
  }


  // ----- Development Server --------------------------------------------------

  config.devServer = {
    inline: true,
    host: '0.0.0.0',
    port: env.port || 8080,
    historyApiFallback: true,
    // Configure output.
    stats: {
      colors: true,
      hash: false,
      version: false,
      timings: true,
      assets: false,
      chunks: false,
      modules: false,
      reasons: false,
      children: false,
      source: false,
      errors: true,
      errorDetails: true,
      warnings: true,
      publicPath: false
    }
  };


  // ----- Miscellany ----------------------------------------------------------

  // Exit on error when compiling.
  config.bail = env.dist;


  return config;
};
