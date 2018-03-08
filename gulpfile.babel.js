import del from 'del';
import gulp from 'gulp';

const chrome_dir = 'dist/chrome';
const ff_dir = 'dist/firefox';

/*
 * For small tasks you can use arrow functions and export
 */
const clean = () => del([chrome_dir, ff_dir]);
export {clean};

/*
 * You can still declare named functions and export them as tasks
 */
export function styles() {
	return gulp.src(['legacy/src/css/**/*.css']
		.filter(function(value) {
			return value !== '';
		}))
		.pipe(gulp.dest(chrome_dir + '/css'))
		.pipe(gulp.dest(ff_dir + '/css'));
}

export function templates() {
	return gulp.src('legacy/src/templates/**/*')
		.pipe(gulp.dest(chrome_dir + '/templates'))
		.pipe(gulp.dest(ff_dir + '/templates'));
}

const build = gulp.series(clean, gulp.parallel(styles, templates));
export {build};

/*
 * Export a default task
 */
export default build;