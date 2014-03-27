var gulp = require('gulp');
var concat = require('gulp-concat');

var paths = {
  scripts: ['./src/*.js']
};

gulp.task('scripts', function() {
  gulp.src(paths.scripts)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', ["scripts", "watch"]);