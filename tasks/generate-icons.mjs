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
  // Website icons
  {
    source: 'resources/icons/lehrgrapht-dark.svg',
    destinations: ['projects/website/public'],
    type: 'png',
    name: 'web-app-manifest',
    sizes: [192, 512],
  },
  {
    source: 'resources/icons/lehrgrapht-dark.svg',
    destinations: ['projects/website/public'],
    type: 'png',
    name: 'favicon',
    sizes: [96],
  },
  {
    source: 'resources/icons/lehrgrapht-dark.svg',
    destinations: ['projects/website/public'],
    type: 'png',
    name: 'apple-touch-icon',
    sizes: [180],
    sizePostfix: false,
  },
  {
    source: 'resources/icons/lehrgrapht-dark.svg',
    destinations: ['projects/website/public'],
    type: 'ico',
    name: 'favicon',
    sizes: [48],
    sizePostfix: false,
  },
];

export default gulp.parallel(
  icons.flatMap(icon => {
    const extension = extname(icon.source);
    const name = icon.name ?? basename(icon.source, extension);
    const sizePostfix = icon.sizePostfix ?? true;

    return icon.destinations.flatMap(destination =>
      icon.sizes.map(size => {
        const sizePostfixText = sizePostfix ? `-${size}x${size}` : '';
        return convertIcon({
          background: icon.background,
          source: icon.source,
          width: size,
          height: size,
          target: join(destination, `${name}${sizePostfixText}.${icon.type}`),
        });
      }),
    );
  }),
);
