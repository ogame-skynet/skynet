import concat from 'gulp-concat';
import del from 'del';
import gulp from 'gulp';
import jsonTransform from 'gulp-json-transform';
//import merge from 'merge-stream';
//import notify from 'gulp-notify';
import order from 'gulp-order';
import rename from 'gulp-rename';

const chrome_dir = 'dist/chrome';
const ff_dir = 'dist/firefox';
const version = '5.0.0-alpha.0';
const version_chrome = '4.999.999.999';

const paths = {
	dist: {
		chrome: 'dist/chrome',
		firefox: 'dist/firefox'
	},
	gfx: {
		src: 'src/main/resources/gfx/**/*',
		dest: '/gfx'
	},
	extJS: {
		src: 'legacy/src/ext/**/*',
		dest: '/ext'
	},
	locales: {
		src: 'src/main/resources/locales/**/*',
		dest: '/_locales'
	},
	manifest: {
		src: 'src/main/resources/manifest.json'
	},
	legacy: {
		js: {
			backend: {
				chrome: 'legacy/src/js/backend/chrome/*.js',
				firefox: 'legacy/src/js/backend/firefox/*.js',
				src: 'legacy/src/js/backend/*.js'
			},
			common: 'legacy/src/js/common/*.js',
			content: {
				chrome: 'legacy/src/js/content/chrome/*.js',
				firefox: 'legacy/src/js/content/firefox/*.js',
				src: 'legacy/src/js/content/*.js'
			}
		}
	},
	styles: {
		src: 'legacy/src/css/**/*.css',
		dest: '/css'
	},
	templates: {
		src: 'legacy/src/templates/**/*',
		dest: '/templates'
	}
};

const clean = () => del([chrome_dir, ff_dir]);

const backgroundJS = () => {
	return gulp.src(
		[paths.legacy.js.common, paths.legacy.js.backend.chrome, paths.legacy.js.backend.src])
		.pipe(order(['**/common/*.js', '**/chrome/!(main.js)', '**/Skynet.js', '**/!(main.js)',
			'**/chrome/main.js'], {base: 'legacy/src/js'}))
		.pipe(concat('background.js'))
		.pipe(gulp.dest(paths.dist.chrome + '/js'));
};

const contentJS = () => {

	return gulp.src(
		[paths.legacy.js.common, paths.legacy.js.content.chrome, paths.legacy.js.content.src])
		//.pipe(notify('Before order: <%= file.path %>'))
		.pipe(order(
			['**/common/*.js', '**/chrome/!(main.js)', '**/observer.js', '**/Skynet.js', '**/!(main.js)',
				'**/chrome/main.js'], {base: 'legacy/src/js'}))
		//.pipe(notify('After order: <%= file.path %>'))
		.pipe(concat('content.js'))
		.pipe(gulp.dest(paths.dist.chrome + '/js'));

	//return gulp.src('src/main/js/**/*')
	//	.pipe(concat('content.js'))
	//	.pipe(gulp.dest(paths.dist.chrome + '/js'));
};

const extRes = (done) => {
	gulp.src(paths.extJS.src)
		.pipe(gulp.dest(paths.dist.chrome + paths.extJS.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.extJS.dest));
	gulp.src('./node_modules/webextension-polyfill/dist/browser-polyfill.min.js')
		.pipe(gulp.dest(paths.dist.chrome + paths.extJS.dest));
	done();
};

const locales = () => {
	return gulp.src(paths.locales.src)
		.pipe(rename((path) => {
			path.dirname += '/' + path.basename.substr(-2);
			path.basename = 'messages';
		}))
		.pipe(gulp.dest(paths.dist.chrome + paths.locales.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.locales.dest));
};

const resources = (done) => {
	gulp.src(paths.gfx.src)
		.pipe(gulp.dest(paths.dist.chrome + paths.gfx.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.gfx.dest));
	gulp.src(paths.manifest.src)
		.pipe(jsonTransform((data) => {
			const json = {};
			Object.keys(data).forEach((key) => {
				if (key === 'version') {
					json[key] = version_chrome;
				} else if (key === 'version_name') {
					json[key] = version;
				} else if (key === 'applications') {
					// ignore for Chrome
				} else {
					json[key] = data[key];
				}
			});
			return json;
		}, 2))
		.pipe(gulp.dest(paths.dist.chrome));
	done();
};

const styles = () => {
	return gulp.src([paths.styles.src]
		.filter((value) => {
			return value !== '';
		}))
		.pipe(gulp.dest(paths.dist.chrome + paths.styles.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.styles.dest));
};

const templates = () => {
	return gulp.src(paths.templates.src)
		.pipe(gulp.dest(paths.dist.chrome + paths.templates.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.templates.dest));
};

const build = gulp.series(clean,
	gulp.parallel(backgroundJS, contentJS, extRes, locales, resources, styles, templates));
export {build, clean, backgroundJS, contentJS, extRes, locales, resources, styles, templates};

/*
 * Export a default task
 */
//noinspection JSUnusedGlobalSymbols
export default build;