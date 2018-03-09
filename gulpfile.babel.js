import concat from 'gulp-concat';
import del from 'del';
import gulp from 'gulp';
import jsonTransform from 'gulp-json-transform';
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

const contentJS = () => {
	return gulp.src('src/main/js/**/*')
		.pipe(concat('content.js'))
		.pipe(gulp.dest(paths.dist.chrome + '/js'));
};

const extRes = () => {
	return gulp.src(paths.extJS.src)
		.pipe(gulp.dest(paths.dist.chrome + paths.extJS.dest))
		.pipe(gulp.dest(paths.dist.firefox + paths.extJS.dest));
};

const locales = () => {
	return gulp.src(paths.locales.src)
		.pipe(rename(function(path) {
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
		.pipe(jsonTransform(function(data) {
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
		.filter(function(value) {
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
	gulp.parallel(contentJS, extRes, locales, resources, styles, templates));
export {build, clean, contentJS, extRes, locales, resources, styles, templates};

/*
 * Export a default task
 */
export default build;