import { RunConfiguration } from '../../models/run-configuration';
import { NoOpWordService } from './no-op-word.service';
import { WordForWebService } from './word-for-web.service';
import { WordForDesktopService } from './word-for-desktop.service';
import { WordService } from './word.service';

export const wordServiceFactory = (
  runConfiguration: RunConfiguration,
): WordService => {
  if (!runConfiguration.runsInOffice) {
    return new NoOpWordService();
  }

  if (runConfiguration.runsOnline) {
    return new WordForWebService();
  }

  return new WordForDesktopService();
};
