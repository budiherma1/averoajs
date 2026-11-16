import { Log } from '@averoa/utilities';

class ExampleRepository {
  sample() {
    Log.info('ExampleRepository');
  }
}

export default new ExampleRepository();
