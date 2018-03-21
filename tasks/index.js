import del from 'del';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import jsonTransform from 'gulp-json-transform';
import rename from 'gulp-rename';

const isChrome = process.argv.indexOf('--chrome') > -1;
const isFirefox = process.argv.indexOf('--firefox') > -1;
const isLegacy = process.argv.indexOf('--legacy') > -1;
const isAll = !isFirefox && !isChrome && !isLegacy;
const isProd = process.argv.indexOf('--prod') > -1;

const version = '5.0.0-alpha.0';
const version_chrome = '4.999.999.999';

const paths = {
	dist: {
		chrome: 'dist/chrome',
		chrome_legacy: 'dist/chrome_legacy',
		firefox: 'dist/firefox'
	},
	extJS: {
		src: 'legacy/src/ext/**/*',
		dest: '/ext'
	},
	gfx: {
		src: 'src/main/resources/gfx/**/*',
		dest: '/gfx'
	},
	legacy: {
		manifest: 'legacy/src/manifest.json',
	},
	locales: {
		src: 'src/main/resources/locales/**/*',
		dest: '/_locales'
	},
	manifest: 'src/main/resources/manifest.json',
	styles: {
		src: 'legacy/src/css/**/*.css',
		dest: '/css'
	},
	templates: {
		src: 'legacy/src/templates/**/*',
		dest: '/templates'
	}
};

/**
 * This method cleans the dist folders.
 *
 * @return {*}
 */
const clean = () => {
	if (isChrome) {
		return del(paths.dist.chrome);
	}
	if (isFirefox) {
		return del(paths.dist.firefox);
	}
	if (isLegacy) {
		return del(paths.dist.chrome_legacy);
	}
	return del([paths.dist.chrome, paths.dist.firefox, paths.dist.chrome_legacy]);
};

/**
 * This method moves the external resources to dist folders.
 *
 * @return {NodeJS.WritableStream | NodeJS.WritableStream | *}
 */
const extRes = () => {
	if (isLegacy || isAll) {
		const result = gulp.src(paths.extJS.src)
			.pipe(gulp.dest(paths.dist.chrome_legacy + paths.extJS.dest));
		if (!isAll) {
			return result;
		}
	}
	return gulp.src([paths.extJS.src, './node_modules/webextension-polyfill/dist/browser-polyfill.min.js'])
		.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome + paths.extJS.dest)))
		.pipe(gulpIf(isFirefox || isAll, gulp.dest(paths.dist.firefox + paths.extJS.dest)));
};

const locales = () => {
	return gulp.src(paths.locales.src)
		.pipe(rename((path) => {
			path.dirname += '/' + path.basename.substr(-2);
			path.basename = 'messages';
		}))
		.pipe(gulpIf(isLegacy || isAll, gulp.dest(paths.dist.chrome_legacy + paths.locales.dest)))
		.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome + paths.locales.dest)))
		.pipe(gulpIf(isFirefox || isAll, gulp.dest(paths.dist.firefox + paths.locales.dest)));
};

/**
 * This method builds the browser specific manifest.json
 *
 * @param done callback method called, when done
 */
const manifest = (done) => {
	if (isAll || isLegacy) {
		gulp.src(paths.legacy.manifest)
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
			.pipe(gulpIf(isLegacy || isAll, gulp.dest(paths.dist.chrome_legacy)));
	}
	if (isAll || isChrome) {
		gulp.src(paths.manifest)
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
			.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome)));
	}
	if (isAll || isFirefox) {
		gulp.src(paths.manifest)
			.pipe(jsonTransform((data) => {
				const json = {};
				Object.keys(data).forEach((key) => {
					if (key === 'version') {
						json[key] = version;
					} else if (key === 'version_name') {
						// ignore for Firefox
					} else {
						json[key] = data[key];
					}
				});
				return json;
			}, 2))
			.pipe(gulp.dest(paths.dist.firefox));
	}
	done();
};

const packBackgroundJS = (done) => {
	done();
};

const packContentJS = (done) => {
	done();
};

/**
 * This method copies the image resources to the distribution folders.
 *
 * @return {NodeJS.WritableStream | NodeJS.WritableStream | *}
 */
const resources = () => {
	return gulp.src(paths.gfx.src)
		.pipe(gulpIf(isLegacy || isAll, gulp.dest(paths.dist.chrome_legacy + paths.gfx.dest)))
		.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome + paths.gfx.dest)))
		.pipe(gulpIf(isFirefox || isAll, gulp.dest(paths.dist.firefox + paths.gfx.dest)));
};

/**
 * This method copies the CSS resources to the distribution folders.
 *
 * @return {NodeJS.WritableStream | NodeJS.WritableStream | *}
 */
const styles = () => {
	return gulp.src([paths.styles.src])
		.pipe(gulpIf(isLegacy || isAll, gulp.dest(paths.dist.chrome_legacy + paths.styles.dest)))
		.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome + paths.styles.dest)))
		.pipe(gulpIf(isFirefox || isAll, gulp.dest(paths.dist.firefox + paths.styles.dest)));
};

/**
 * This method copies the HTML templates to the distribution folders.
 *
 * @return {NodeJS.WritableStream | NodeJS.WritableStream | *}
 */
const templates = () => {
	return gulp.src(paths.templates.src)
		.pipe(gulpIf(isLegacy || isAll, gulp.dest(paths.dist.chrome_legacy + paths.templates.dest)))
		.pipe(gulpIf(isChrome || isAll, gulp.dest(paths.dist.chrome + paths.templates.dest)))
		.pipe(gulpIf(isFirefox || isAll, gulp.dest(paths.dist.firefox + paths.templates.dest)));
};

const test = (done) => {
	console.debug('Is Production?', isProd);
	done();
};

const build = gulp.series(clean, gulp.parallel(manifest, resources, extRes, locales, styles, templates, test,
	packBackgroundJS, packContentJS));

// noinspection JSUnusedGlobalSymbols
export default build;
