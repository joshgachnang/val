export class SlackUser {
  public id: string;
  public name: string;
  public teamId: string;
  public status: string;

  // Profile data
  public realName: string;
  public tzOffset: number;
  public tzLabel: string;

  constructor(userObj: any) {
    this.id = userObj.id;
    this.name = userObj.name;
    this.tzOffset = userObj.tzOffset || userObj.tz_offset;
    this.tzLabel = userObj.tzLabel || userObj.tz_label;
    this.realName = userObj.realName || userObj.real_name;
    this.teamId = userObj.teamId || userObj.team_id;

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

export class FacebookUser {
  public id: string;

  constructor(data: any) {
    this.id = data.id;
  }
}

export default class User {
  public id: string;
  public slack: SlackUser;
  public twilio: TwilioUser;
  public alexa: AlexaUser;
  public push: PushUser;
  public facebook: FacebookUser;
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
    if (data.facebook) {
      this.updateFacebookUser(data.facebook);
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

  public updateFacebookUser(facebookUserObj: any) {
    this.facebook = new FacebookUser(facebookUserObj);
  }

  // See if any subusers have the same id
  public containsId(id: string): boolean {
    if (this.id === id) {
      return true;
    } else if (this.slack && this.slack.id === id) {
      return true;
    } else if (this.twilio && this.twilio.id === id) {
      return true;
    } else if (this.facebook && this.facebook.id === id) {
      return true;
    }
    return false;
  }

  public onTeam(id: string): boolean {
    if (!id) {
      return false;
    }
    if (this.slack) {
      return this.slack.teamId === id;
    }
    return false;
  }

  public serialize() {
    return JSON.parse(JSON.stringify(this));
  }
}
