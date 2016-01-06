const gulp = require('gulp');
const gulp_util = require('gulp-util');
const notify = require('gulp-notify');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const del = require('del');
const json_transform = require('gulp-json-transform');
const rename = require('gulp-rename');
const shell = require('gulp-shell');
const wait = require('gulp-wait');
const order = require('gulp-order');
const gulpif = require('gulp-if');
const merge = require('merge-stream');

const chrome_dir = 'build/chrome';
const ff_dir = 'build/firefox';
const dist = true;

function lint(src) {
	var streams = src;
	if (typeof src === 'string' || Array.isArray(src)) {
		//noinspection JSUnresolvedFunction
		streams = gulp.src(src);
	}
	//noinspection JSUnresolvedFunction
	return streams
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
}

//noinspection JSUnresolvedFunction
gulp.task('build packages', function () {
	const versionChrome = '4.1.2.0';
	const version = '4.1.2';
	const name = 'Skynet';
	const desc = 'The next generation ogaming...';
	const author = 'Martin Burchard';
	const homepage = 'http://www.martin-burchard.de/skynet';
	const ff_pack = {
		name: name.toLowerCase(),
		title: name,
		description: desc,
		version: version,
		id: 'jid1-j57LkwpAWjGJXw@jetpack',
		icon: 'icon.png',
		author: author,
		homepage: homepage
	};
	const chrome_man = {
		manifest_version: 2,
		name: name || '__MSG_ExtensionName__',
		short_name: name || '__MSG_ExtensionName__',
		description: desc || '__MSG_ExtensionDescription__',
		version: versionChrome,
		version_name: version,
		author: author,
		homepage_url: homepage,
		default_locale: 'en',
		icons: {
			'16': 'gfx/icon_16.png',
			'48': 'gfx/icon_48.png',
			'128': 'gfx/icon_128.png'
		},
		background: {
			scripts: [
				'js/background.js'
			],
			persistent: true
		},
		content_scripts: [
			{
				matches: ['http://*.ogame.gameforge.com/*', 'https://*.ogame.gameforge.com/*'],
				exclude_globs: ['*board*', '*support*'],
				run_at: 'document_start',
				css: [
					'ext/nanoscroller.css',
					'css/standard.css'
				],
				js: [
					'ext/jquery.min.js',
					'ext/jquery-ui.min.js',
					'ext/knockout.min.js',
					'ext/jquery.nanoscroller.min.js',
					'js/content.js'
				]
			}
		],
		permissions: [
			'storage',
			'tabs',
			'http://*.ogame.gameforge.com/',
			'https://*.ogame.gameforge.com/'
		],
		web_accessible_resources: [
			'ext/jquery-ui.min.css',
			'ext/images/*',
			'css/images.css',
			'gfx/*',
			'templates/*'
		]
	};
	//noinspection JSUnresolvedFunction
	string_src('manifest.json', JSON.stringify(chrome_man, null, 2)).pipe(gulp.dest(chrome_dir));
	//noinspection JSUnresolvedFunction
	string_src('package.json', JSON.stringify(ff_pack, null, 2)).pipe(gulp.dest(ff_dir));
	//noinspection JSUnresolvedFunction
	gulp.src('src/gfx/**/*')
		.pipe(gulp.dest(chrome_dir + '/gfx'))
		.pipe(gulp.dest(ff_dir + '/data/gfx'));
	//noinspection JSUnresolvedFunction
	gulp.src('src/gfx/icon_128.png')
		.pipe(rename({basename: 'icon'}))
		.pipe(gulp.dest(ff_dir));
});

//noinspection JSUnresolvedFunction
gulp.task('clean', function () {
	return del([chrome_dir, ff_dir]);
});

//noinspection JSUnresolvedFunction
gulp.task('default', ['clean'], function () {
	gulp.start('build packages', 'JS Backend', 'i18n', 'ExtRes', 'styles', 'JS Content', 'templates');
});

//noinspection JSUnresolvedFunction
gulp.task('i18n', function () {
	//noinspection JSUnresolvedFunction
	gulp.src(['src/i18n/**/*'])
		.pipe(rename({prefix: 'messages_'}))
		.pipe(gulp.dest(ff_dir + '/data/i18n'))
		.pipe(json_transform(function (data) {
			const json = {};
			Object.keys(data).forEach(function (key) {
				json[key] = {message: data[key]};
			});
			return json;
		}, '  '))
		.pipe(rename(function (path) {
			path.dirname += '/' + path.basename.substr(-2);
			path.basename = 'messages';
		}))
		.pipe(gulp.dest(chrome_dir + '/_locales'));
});

//noinspection JSUnresolvedFunction
gulp.task('JS Backend', function () {
	const common = lint(['src/js/common/**/*.js']);
	const backend = lint(['src/js/backend/**/*.js', '!src/js/backend/chrome/**/*',
		'!src/js/backend/firefox/**/*']
		.filter(function (value) {
			return value !== null && value !== '';
		}));

	//noinspection JSUnresolvedFunction
	merge(common, lint('src/js/backend/chrome/**/*'), backend)
	//.pipe(notify('Found file: <%= file.path %>'))
		.pipe(order(['**/common/**/*.js', '**/backend/chrome/**/!(main.js)', '**/Skynet.js',
			'**/!(main.js)', '**/chrome/**/main.js'], {base: 'src/js'}))
		//.pipe(notify('After order: <%= file.path %>'))
		.pipe(concat('background.js'))
		.pipe(uglify({
			mangle: false,
			compress: false,
			output: {
				beautify: true,
				indent_level: 2
			}
		}))
		.pipe(gulpif(dist, uglify({mangle: true})))
		.pipe(gulp.dest(chrome_dir + '/js'));

	//noinspection JSUnresolvedFunction
	merge(common, lint('src/js/backend/firefox/**/*'), backend)
	//.pipe(notify('Found file: <%= file.path %>'))
		.pipe(order(['**/common/**/*.js', '**/backend/firefox/**/!(main.js)', '**/Skynet.js',
			'**/!(main.js)', '**/firefox/**/main.js'], {base: 'src/js'}))
		//.pipe(notify('After order: <%= file.path %>'))
		.pipe(concat('index.js'))
		.pipe(uglify({
			mangle: false,
			compress: false,
			output: {
				beautify: true,
				indent_level: 2
			}
		}))
		.pipe(gulpif(dist, uglify({mangle: true})))
		.pipe(gulp.dest(ff_dir));
});

//noinspection JSUnresolvedFunction
gulp.task('JS Content', function () {
	const common = lint(['src/js/common/**/*.js']);
	const content = lint(['src/js/content/**/*.js', '!src/js/content/chrome/**/*',
		'!src/js/content/firefox/**/*']
		.filter(function (value) {
			return value !== null && value !== '';
		}));

	//noinspection JSUnresolvedFunction
	merge(common, lint('src/js/content/chrome/**/*'), content)
	//.pipe(notify('Found file: <%= file.path %>'))
		.pipe(order(['**/common/**/*.js', '**/content/chrome/**/!(main.js)', '**/Skynet.js',
			'**/!(main.js)', '**/chrome/**/main.js'], {base: 'src/js'}))
		//.pipe(notify('After order: <%= file.path %>'))
		.pipe(concat('content.js'))
		.pipe(uglify({
			mangle: false,
			compress: false,
			output: {
				beautify: true,
				indent_level: 2
			}
		}))
		.pipe(gulpif(dist, uglify({mangle: true})))
		.pipe(gulp.dest(chrome_dir + '/js'));

	//noinspection JSUnresolvedFunction
	merge(common, lint('src/js/content/firefox/**/*'), content)
	//.pipe(notify('Found file: <%= file.path %>'))
		.pipe(order(['**/common/**/*.js', '**/content/firefox/**/!(main.js)', '**/Skynet.js',
			'**/!(main.js)', '**/firefox/**/main.js'], {base: 'src/js'}))
		//.pipe(notify('After order: <%= file.path %>'))
		.pipe(concat('content.js'))
		.pipe(uglify({
			mangle: false,
			compress: false,
			output: {
				beautify: true,
				indent_level: 2
			}
		}))
		.pipe(gulpif(dist, uglify({mangle: true})))
		.pipe(gulp.dest(ff_dir + '/data'));
});

//noinspection JSUnresolvedFunction
gulp.task('ExtRes', function () {
	//noinspection JSUnresolvedFunction
	gulp.src('src/ext/**/*')
		.pipe(gulp.dest(chrome_dir + '/ext'))
		.pipe(gulp.dest(ff_dir + '/data/ext'));
});

//noinspection JSUnresolvedFunction
gulp.task('styles', function () {
	//noinspection JSUnresolvedFunction
	gulp.src(['src/css/**/*.css']
		.filter(function (value) {
			return value !== null && value !== '';
		}))
		.pipe(gulp.dest(chrome_dir + '/css'))
		//.pipe(minifycss())
		.pipe(gulp.dest(ff_dir + '/data/css'));
});

//noinspection JSUnresolvedFunction
gulp.task('templates', function () {
	//noinspection JSUnresolvedFunction
	gulp.src('src/templates/**/*')
		.pipe(gulp.dest(chrome_dir + '/templates'))
		.pipe(gulp.dest(ff_dir + '/data/templates'));
});

//noinspection JSUnresolvedFunction
gulp.task('xpi', function () {
	//noinspection JSUnresolvedFunction
	gulp.watch('build/firefox/package.json', function () {
		//noinspection JSUnresolvedFunction
		gulp.src('')
			.pipe(wait(5000))
			.pipe(shell(['jpm post --post-url http://localhost:8888/'], {
				cwd: 'build/firefox'
			}));
	});
});

/**
 *
 * @param {string} filename
 * @param {string} string
 * @returns {*}
 */
function string_src(filename, string) {
	var src = require('stream').Readable({objectMode: true});
	src._read = function () {
		//noinspection JSUnresolvedFunction
		this.push(
			new gulp_util.File({cwd: "", base: "", path: filename, contents: new Buffer(string)}));
		this.push(null)
	};
	return src
}