import { Log } from '@averoa/utilities';

class ExampleJob {
  sample() {
    Log.info('ExampleJob');
  }
}

export default new ExampleJob();
