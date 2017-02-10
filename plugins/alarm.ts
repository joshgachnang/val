import Response from '../response';
import Robot from '../robot';

type AlarmRepeat =
  'never' | 'daily' | 'weekly' | 'monthly' | 'everyTwoWeeks' | 'weekdays' | 'weekends' | 'yearly';

export class Alarm {
  constructor(public time: Date, public repeats: AlarmRepeat) {
  }
}

export default function(robot) {
  robot.hear(/what alarms are set/i, {}, (response: Response) => {
    let alarms = robot.brain.get('alarms');
    response.reply(alarms);
  });
}
