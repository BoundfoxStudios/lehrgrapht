import gulp from 'gulp';
import replace from 'gulp-replace';

const localUrl = 'https://localhost:4200';
const productionUrl = 'https://lehrgrapht.de/addin';

const copyManifestFile = () =>
  function copyManifestFile() {
    return gulp.src('manifest.xml').pipe(gulp.dest('dist/lehrgrapht/browser'));
  };

const replaceDeploymentUrl = () =>
  function replaceDeploymentUrl() {
    return gulp
      .src('dist/lehrgrapht/browser/manifest.xml')
      .pipe(replace(localUrl, productionUrl))
      .pipe(gulp.dest('dist/lehrgrapht/browser'));
  };

export default gulp.series(copyManifestFile(), replaceDeploymentUrl());
