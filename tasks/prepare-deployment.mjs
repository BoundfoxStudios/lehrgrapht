import gulp from 'gulp';
import replace from 'gulp-replace';
import packageJson from '../package.json' with { type: 'json' };

const localUrl = 'https://localhost:4200';
const productionUrl = `https://lehrgrapht.de/addin/${packageJson.version}`;

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

const replaceVersion = () =>
  function replaceVersion() {
    return gulp
      .src('dist/lehrgrapht/browser/manifest.xml')
      .pipe(
        replace(
          '<Version>1.0.0.0</Version>',
          `<Version>${packageJson.version}</Version>`,
        ),
      )
      .pipe(gulp.dest('dist/lehrgrapht/browser'));
  };

export default gulp.series(
  copyManifestFile(),
  replaceDeploymentUrl(),
  replaceVersion(),
);
