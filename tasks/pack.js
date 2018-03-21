import path from 'path';
import webpack from 'webpack';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

const config = {
	context: path.resolve(__dirname, '../src/main/js'),
	devtool: 'source-map',
	entry: './modul-test.js',
	mode: 'none',
	output: {
		filename: './mybundle.js',
		path: path.resolve(__dirname, '../dist/firefox/js')
	},
	plugins: [
		new UglifyJsPlugin({
			sourceMap: true,
			uglifyOptions: {
				compress: false,
				mangle: false,
				output: {
					beautify: true,
					indent_level: 2,
					quote_style: 3,
					width: 120
				}
			}
		})
	]
};

const scripts = () => {
	return new Promise(resolve => webpack(config, (err, stats) => {
		if (err) {
			console.error('Webpack', err);
		}
		console.info(stats.toString({/* stats options */}));
		resolve();
	}));
};

export { config, scripts };