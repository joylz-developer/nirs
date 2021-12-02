const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');

const distPath = path.join(__dirname, '/dist');
const srcPath = path.join(__dirname, '/src');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const optimization = () => {
	const config = {
		splitChunks: {
			chunks: 'all',
		},
	}

	if (isProd) {
		config.minimizer = [
			new CssMinimizerWebpackPlugin(),
		]
	}
	return config
}

function generateHtmlPlugins(templateDir) {
	const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir))
		.filter(file => file.endsWith('.html'));
	return templateFiles.map(item => {
		const parts = item.split('.');
		const name = parts[0];
		const extension = parts[1];
		return new HTMLWebpackPlugin({
			filename: `${name}.html`,
			template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
			chunks: [`${name}`],
			minify: {
				collapseWhitespace: false,
			},
			// inject: false,
		})
	});
}

const htmlPlugins = generateHtmlPlugins('./src/html');

const plugins = () => {
	return [
		new webpack.ProgressPlugin(),
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			linkType: 'text/css',
		}),
	].concat(htmlPlugins);
}

const scssLoaders = extra => {
	let loaders = [
		'style-loader',
		{
			loader: 'css-loader',
			options: {
				sourceMap: true,
			},
		}, {
			loader: 'postcss-loader',
			options: {
				sourceMap: true,
			},
		}, {
			loader: 'sass-loader',
			options: {
				sourceMap: true,
			},
		},
	]

	if (isProd) {
		loaders = [{
			loader: MiniCssExtractPlugin.loader,
			options: {},
		}, {
			loader: 'css-loader',
			options: {
				sourceMap: false,
				importLoaders: 1,
			},
		}, {
			loader: 'postcss-loader',
			options: {
				sourceMap: false,
			},
		}, {
			loader: 'sass-loader',
			options: {
				sourceMap: false,
				implementation: require('sass'),
			},
		}]
	}

	if (extra) {
		loaders.push(extra)
	}

	return loaders
}

const config = {
	context: path.resolve(__dirname, 'src'),
	entry: {
		index: path.resolve(__dirname, './src/index.js'),
		// catalog: path.resolve(__dirname, './src/catalog.js'),
		// catalog1: path.resolve(__dirname, './src/catalog1.js'),
	},
	output: {
		// filename: filename('js'),
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.js'],
	},
	plugins: plugins(),
	optimization: optimization(),
	devServer: {
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, './dist'),
        open: true,
        compress: true,
        port: 8080,
    },
	module: {
		noParse: [
			/[\/\\]node_modules[\/\\]jquery[\/\\]dist[\/\\]jquery.min\.js$/,
		],
		rules: [
			{
				test: /\.html$/i,
				include: path.resolve(__dirname, 'src/html'),
				use: [
					{ 
						loader: 'html-loader',
						options: {
							minimize: false,
							esModule: false,
						},
					},
				]
			},
			{
				test: /\.((c|sa|sc)ss)$/i,
				use: scssLoaders(),
			},
			{
				test: /\.(png|jpeg|jpg|gif)$/i,
				use: [{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'images',
						},
					},
				],
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [{
					loader: 'file-loader',
					options: {
						name: '[path][name].[ext]',
					},
				}],
			},
		],
	},
};

module.exports = config;