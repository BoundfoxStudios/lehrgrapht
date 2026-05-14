import gulp from 'gulp';
import convertIcon from './convert-icon.mjs';
import { basename, extname, join } from 'node:path';

const defaultIconSizes = [16, 32, 64, 80, 128];

const icons = [
  {
    source: 'resources/icons/lehrgrapht-dark.svg',
    destinations: ['projects/addin/public/app-icons'],
    type: 'png',
    sizes: defaultIconSizes,
  },
  {
    source: 'resources/icons/lehrgrapht-white.svg',
    destinations: ['projects/addin/public/app-icons'],
    type: 'png',
    sizes: defaultIconSizes,
  },
  {
    source: 'resources/icons/hide-solution.svg',
    destinations: ['projects/addin/public/icons'],
    type: 'png',
    sizes: defaultIconSizes,
  },
  {
    source: 'resources/icons/show-solution.svg',
    destinations: ['projects/addin/public/icons'],
    type: 'png',
    sizes: defaultIconSizes,
  },
];

export default gulp.parallel(
  icons.flatMap(icon => {
    const extension = extname(icon.source);
    const name = basename(icon.source, extension);

    return icon.destinations.flatMap(destination =>
      icon.sizes.map(size =>
        convertIcon({
          background: icon.background,
          source: icon.source,
          width: size,
          height: size,
          target: join(destination, `${name}-${size}-${size}.${icon.type}`),
        }),
      ),
    );
  }),
);
