var gulp = require('gulp');
var concat = require('gulp-concat');
var prefix = require('gulp-autoprefixer');
var babel = require("gulp-babel");

var paths = {
  scripts: ['./src/polyfills/*.js', './src/*.js'],
  styles: ['./src/*.css'],
};

gulp.task('es5', function() {
  gulp.src(paths.scripts)
    .pipe(babel({
      presets: ['es2015'],
    }))
    .pipe(concat('column-view.es5.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('es6', function() {
  gulp.src(paths.scripts)
    .pipe(concat('column-view.es6.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('styles', function() {
  gulp.src(paths.styles)
  .pipe(prefix('last 3 version', '> 1%'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['es6', 'es5']);
  gulp.watch(paths.styles, ['styles']);
});

gulp.task('default', ['es5', 'es6', 'styles', 'watch']);
