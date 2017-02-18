import * as mocha from 'mocha';
import * as chai from 'chai';

import Config from '../config';
import FakeRobot from './fakeRobot';

function getFakeRobot(plugins) {
  let config = new Config();
  config.name = 'fake';
  config.plugins = plugins;
  config.adapters = ['test/fakeAdapter'];

  let robot = new FakeRobot(config);
  return robot;
}

describe('Test with hello plugin', () => {
  beforeEach(() => {

  });

  it('should say hello') {

  }
}
