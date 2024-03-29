const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const {
    prod_Path,
    src_Path
} = require('./path');
const {
    selectedPreprocessor
} = require('./loader');

module.exports = {
    entry: {
        main: './' + src_Path + '/crypto-tips.ts'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, prod_Path),
        filename: '[name].[chunkhash].js'
    },
    devtool: 'source-map',
    devServer: {
        open: true,
    },
    module: {
        rules: [
            {
                test: /-tips.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: selectedPreprocessor.fileRegexp,
                use: [
                    //   {
                    //   loader: MiniCssExtractPlugin.loader
                    // },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false,
                            sourceMap: false
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: false
                        }
                    },
                    {
                        loader: selectedPreprocessor.loaderName,
                        options: {
                            sourceMap: false
                        }
                    },
                ]
            }]
    },
    plugins: [
        // new MiniCssExtractPlugin({
        //   filename: 'style.css'
        // }),
        new HtmlWebpackPlugin({
            inject: false,
            hash: false,
            template: './' + src_Path + '/index.html',
            filename: 'index.html'
        })
    ]
};
