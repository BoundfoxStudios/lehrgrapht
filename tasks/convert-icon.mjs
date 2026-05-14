import gulp from 'gulp';
import through2 from 'through2';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { basename, dirname, extname } from 'node:path';

const transformImage = ({ width, height, background, targetExt }) =>
  through2.obj(async function (file) {
    let pipeline = sharp(file.contents).resize(width, height, {
      fit: 'contain',
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });

    if (background) {
      pipeline = pipeline.flatten({ background });
    }

    if (targetExt === '.ico') {
      // Why: array form bypasses png-to-ico's auto-multiplexing that would
      // upscale to 256×256 and emit 16/32/48/256 entries.
      const pngBuffer = await pipeline.png().toBuffer();
      file.contents = await pngToIco([pngBuffer]);
    } else {
      file.contents = await pipeline.toBuffer();
    }

    return file;
  });

const renameTo = newBasename =>
  through2.obj(async function (file) {
    file.basename = newBasename;
    return file;
  });

const convertIcon = ({ source, target, width, height, background }) => {
  const task = () =>
    gulp
      .src(source)
      .pipe(
        transformImage({
          width,
          height,
          background,
          targetExt: extname(target).toLowerCase(),
        }),
      )
      .pipe(renameTo(basename(target)))
      .pipe(gulp.dest(dirname(target)));

  task.displayName = `convertIcon (${target})`;
  return task;
};

export default convertIcon;
