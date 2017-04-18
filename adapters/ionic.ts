const request = require('request-promise-native');
import Adapter from '../adapter';
import Envelope from '../envelope';
import {Message} from '../message';
import Response from '../response';
import Robot from '../robot';
import User from '../user';

export class PushMessage extends Message {
  constructor(user: User, public title: string, public message: string, adapter: Adapter) {
    super(user, adapter, undefined);
  }
}

class IonicAPIUser {
  public uuid: string;
  public email: string;
  public custom: any;

  constructor(data: any) {
    this.uuid = data.uuid;
    this.email = data.details.email;
    this.custom = data.custom;
  }
}

class IonicPushToken {
  public id: string;
  public token: string;
  public os: string;

  constructor(data: any) {
    this.id = data.id;
    this.token = data.token;
    this.os = data.type;
  }
}

export default class Ionic extends Adapter {
  private token: string;
  private BASE_URL = 'https://api.ionic.io';
  robot: Robot;
  public adapterName = 'Ionic';
  public users: IonicAPIUser[] = [];

  constructor(robot: Robot) {
    super(robot);
    this.robot = robot;
    this.token = robot.envKey('IONIC_TOKEN');
    this.fetchUsers();

    robot.hear(/testpush/i, {}, (res: Response) => {
      let message = new PushMessage(new User({}), 'Test Push', 'This is a test push.', this);
      this.sendPush(['mixpanel@nang.in'], message);
    });
  }

  private getOptions(url: string, method: string = 'GET', body?: any) {
    let opts = {
      'url': `${this.BASE_URL}/${url}`,
      'method': method,
      'auth': {
        'bearer': this.token,
      },
      json: true,
    };
    if (body) {
      opts['body'] = body;
    }
    return opts;
  }

  public fetchUsers() {
    return request(this.getOptions('users')).then((res) => {
      let users = res.data.map((d) => new IonicAPIUser(d));
      this.users = users;
      return users;
    });
  }

  public fetchTokens(user: IonicAPIUser) {
    return request(this.getOptions(`push/tokens?user_id=${user.uuid}`))
      .then((res) => {
        return res.data.map((d) => {
          if (d.invalidated !== true && d.valid === true) {
            return new IonicPushToken(d);
          }
          return null;
        }).filter((d) => d !== null);
      });
  }

  public sendPushNotification(token: IonicPushToken, message: PushMessage) {
    let body = {
      tokens: [token.token],
      notification: {title: message.title, message: message.message},
      profile: 'prod',
    };
    this.robot.logger.debug(`Sending push to token ${token.token}: ${message.title}, ${message.message}`);
    if (this.robot.config.DEV === 'true') {
      this.robot.logger.debug(`Not actually sending push in dev`);
      return Promise.resolve();
    }
    return request(this.getOptions('push/notifications', 'POST', body)).then((pushRes) => {
      if (pushRes.data.state === 'failed') {
        this.robot.logger.warn(`Failed to send push to ${token.token}. push uuid: ${pushRes.data.uuid}`);
      } else {
        this.robot.logger.debug(`Push to ${token.token} state: ${pushRes.data.state}`);
      }
    });
  }

  public sendPush(emails: string[], message: PushMessage) {
    return this.fetchUsers().then((users) => {
      let matchingUsers = users.filter((u) => {
        return emails.indexOf(u.email) > -1;
      });
      if (matchingUsers.length !== emails.length) {
        this.robot.logger.warn(`Could not find Ionic users for all emails: ${emails}, found: ` +
          `${matchingUsers.map((u) => u.email)}`);
      }
      return matchingUsers;
    }).then((users) => {
      let promises = [];
      for (let user of users) {
        promises.push(this.fetchTokens(user).then((tokens) => {
          if (tokens.length === 0) {
            this.robot.logger.warn(`Found no tokens for user: ${user.email}`);
            return Promise.resolve();
          }
          let pushPromises = [];
          for (let token of tokens) {
            pushPromises.push(this.sendPushNotification(tokens[0], message));
          }
          return Promise.all(pushPromises);
        }));
      };
      return Promise.all(promises);
    }).catch((e) => {
      this.robot.logger.error(`Error sending push ${message} to email ${emails}; ${e}`);
    });
  }
}
