import gulp from 'gulp';
import { writeFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };

const version = process.env.APP_VERSION || packageJson.version;

const writeVersionTsFile = () =>
  async function writeVersionTsFile(done) {
    const versionTsContent = `export const lehrgraphtVersion = '${version}';`;
    await writeFile('projects/addin/src/version.g.ts', versionTsContent);
    done();
  };

export default gulp.series(writeVersionTsFile());
