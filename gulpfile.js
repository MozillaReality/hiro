var gulp = require('gulp');
var sketch = require('gulp-sketch');
var connect = require('gulp-connect');



gulp.task('sketch', function() {
  return gulp.src('./s23/sketch/*.sketch')
    .pipe(
      sketch({
        export: 'slices',
        formats: 'png',
        outputJSON: 'index.json',
        saveForWeb: true,
        groupConentsOnly: true
      })
    )
    .pipe(gulp.dest('./s23/images'));
});

gulp.task('connect', function() {
  connect.server();
});

gulp.task('default', ['connect']);
