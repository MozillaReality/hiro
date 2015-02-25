var gulp = require('gulp');
var sketch = require('gulp-sketch');
var connect = require('gulp-connect');
var clean = require('gulp-rimraf');


gulp.task('clean', function(cb) {
  gulp.src('./s23/images/*').pipe(clean())
});

gulp.task('sketchtool', function() {
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

gulp.task('sketch', ['clean', 'sketchtool']);

gulp.task('connect', function() {
  connect.server();
});

gulp.task('default', ['connect']);
