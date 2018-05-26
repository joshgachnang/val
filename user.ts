export class SlackUser {
  public id: string;
  public name: string;
  public teamId: string;
  public status: string;

  // Profile data
  public realName: string;

  constructor(userObj: any) {
    this.id = userObj.id;
    this.name = userObj.name;
    this.teamId = userObj.teamId;

    if (userObj.profile) {
      this.realName = userObj.profile.real_name;
    }
  }
}

export class TwilioUser {
  public id: string;
  constructor(data: any) {
    this.id = data.id;
  }
}

export class AlexaUser {
  public id: string;
  public name;
  string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
  }
}

export class PushUser {
  public deviceToken: string;
  constructor(data: any) {
    this.deviceToken = data.deviceToken;
  }
}

export default class User {
  public id: string;
  public slack: SlackUser;
  public twilio: TwilioUser;
  public alexa: AlexaUser;
  public push: PushUser;
  public authToken: string;
  // TODO: add other oauth users, e.g. google, facebook, twitter, fitbit, etc

  constructor(data: any) {
    if (!data.id) {
      this.id = Math.random()
        .toString(36)
        .slice(2);
    } else {
      this.id = data.id;
    }
    if (data.slack) {
      this.updateSlackUser(data.slack);
    }
    if (data.twilio) {
      this.updateTwilioUser(data.slack);
    }
    if (data.alexa) {
      this.updateAlexaUser(data.alexa);
    }
    if (data.push) {
      this.updatePushUser(data.push);
    }
  }

  public updateSlackUser(slackUserObj: any) {
    this.slack = new SlackUser(slackUserObj);
  }

  public updateTwilioUser(twilioUserObj: any) {
    this.twilio = new TwilioUser(twilioUserObj);
  }

  public updateAlexaUser(alexaUserObj: any) {
    this.alexa = new AlexaUser(alexaUserObj);
  }

  public updatePushUser(pushUserObj: any) {
    this.push = new PushUser(pushUserObj);
  }

  // See if any subusers have the same id
  public containsId(id: string) {
    if (this.id === id) {
      return true;
    } else if (this.slack && this.slack.id === id) {
      return true;
    } else if (this.twilio && this.twilio.id === id) {
      return true;
    }
    return false;
  }

  public serialize() {
    return JSON.parse(JSON.stringify(this));
  }
}
