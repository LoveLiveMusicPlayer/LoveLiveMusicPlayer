import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import {merge} from 'webpack-merge';
import {execSync, spawn} from 'child_process';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
    checkNodeEnv('development');
}

const port = process.env.PORT || 1212;
const manifest = path.resolve(webpackPaths.dllPath, 'renderer.json');
const requiredByDLLConfig = module.parent?.filename.includes(
    'webpack.config.renderer.dev.dll'
);

/**
 * Warn if the DLL is not built
 */
if (
    !requiredByDLLConfig &&
    !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))
) {
    console.log(
        chalk.black.bgYellow.bold(
            'The DLL files are missing. Sit back while we build them for you with "npm run build-dll"'
        )
    );
    execSync('npm run postinstall');
}

// @ts-ignore
export default merge(baseConfig, {
    devtool: 'inline-source-map',

    mode: 'development',

    // target: ['web', 'electron-renderer'],
    target: 'electron-renderer',

    // entry: [
    //     `webpack-dev-server/client?http://localhost:${port}/dist`,
    //     'webpack/hot/only-dev-server',
    //     'core-js',
    //     'regenerator-runtime/runtime',
    //     path.join(webpackPaths.srcRendererPath, 'index.tsx'),
    //     path.join(webpackPaths.srcRendererPath, 'pages/DesktopLyric/index.tsx')
    // ],

    entry: {
        dist: `webpack-dev-server/client?http://localhost:${port}/dist`,
        devServer: 'webpack/hot/only-dev-server',
        coreJs: 'core-js',
        runtime: 'regenerator-runtime/runtime',
        index: path.join(webpackPaths.srcRendererPath, 'index.tsx'),
        lrc: path.join(webpackPaths.srcRendererPath, 'pages/DesktopLyric/index.tsx')
    },

    output: {
        path: webpackPaths.distRendererPath,
        // @ts-ignore
        publicPath: '/',
        filename: '[name].dev.js'
        // library: {
        //   type: 'umd',
        // },
    },

    module: {
        rules: [
            {
                test: /\.s?css$/,
                // @ts-ignore
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                        },
                    },
                    'sass-loader',
                ],
                include: /\.module\.s?(c|a)ss$/,
            },
            {
                test: /\.less$/,
                // @ts-ignore
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "less-loader", // compiles Less to CSS
                    options: {
                        lessOptions: {
                            javascriptEnabled: true,
                        }
                    }
                }]
            },
            {
                test: /\.s?css$/,
                // @ts-ignore
                use: ['style-loader', 'css-loader', 'sass-loader'],
                exclude: /\.module\.s?(c|a)ss$/,
            },
            //Font Loader
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                // @ts-ignore
                type: 'asset/resource',
            },
            // SVG Font
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'url-loader',
                    // @ts-ignore
                    options: {
                        limit: 10000,
                        mimetype: 'image/svg+xml',
                    },
                },
            },
            // Common Image Formats
            {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                use: {
                    loader: 'url-loader',
                    // @ts-ignore
                    options: {
                        limit: 10000,
                    },
                },
            },
        ],
    },
    plugins: [
        // @ts-ignore
        requiredByDLLConfig
            ? null
            : new webpack.DllReferencePlugin({
                context: webpackPaths.dllPath,
                manifest: require(manifest),
                sourceType: 'var',
            }),

        // @ts-ignore
        new webpack.NoEmitOnErrorsPlugin(),

        /**
         * Create global constants which can be configured at compile time.
         *
         * Useful for allowing different behaviour between development builds and
         * release builds
         *
         * NODE_ENV should be production so that modules do not perform certain
         * development checks
         *
         * By default, use 'development' as NODE_ENV. This can be overriden with
         * 'staging', for example, by changing the ENV variables in the npm scripts
         */
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development',
        }),

        // @ts-ignore
        new webpack.LoaderOptionsPlugin({
            debug: true,
        }),

        // @ts-ignore
        new ReactRefreshWebpackPlugin(),

        // @ts-ignore
        new HtmlWebpackPlugin({
            filename: path.join('index.html'),
            template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            isBrowser: false,
            env: process.env.NODE_ENV,
            isDevelopment: process.env.NODE_ENV !== 'production',
            nodeModules: webpackPaths.appNodeModulesPath,
            excludeChunks: ['lrc']
        }),
        // @ts-ignore
        new HtmlWebpackPlugin({
            filename: path.join('desktop-lyric.html'),
            template: path.join(webpackPaths.srcRendererPath, 'pages/DesktopLyric/index.html'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            isBrowser: false,
            env: process.env.NODE_ENV,
            isDevelopment: process.env.NODE_ENV !== 'production',
            nodeModules: webpackPaths.appNodeModulesPath,
            excludeChunks: ['index']
        }),
    ],

    node: {
        __dirname: false,
        __filename: false,
    },

    devServer: {
        port,
        compress: true,
        hot: true,
        headers: {'Access-Control-Allow-Origin': '*'},
        static: {
            publicPath: '/',
        },
        historyApiFallback: {
            verbose: true,
            disableDotRule: false,
        },
        onBeforeSetupMiddleware() {
            console.log('启动主线程...');
            spawn('npm', ['run', 'start:main'], {
                shell: true,
                env: process.env,
                stdio: 'inherit',
            })
                .on('close', (code: number) => process.exit(code))
                .on('error', (spawnError) => console.error(spawnError));
        },
    },
});
