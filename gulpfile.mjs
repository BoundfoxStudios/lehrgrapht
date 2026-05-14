import prepareDeploymentTask from './tasks/prepare-deployment.mjs';
import writeVersionFileTask from './tasks/write-version-file.mjs';
import generateIconsTask from './tasks/generate-icons.mjs';

export const prepareDeployment = prepareDeploymentTask;
export const writeVersionFile = writeVersionFileTask;
export const generateIcons = generateIconsTask;
