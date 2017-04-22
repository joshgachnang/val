import Response from '../response';
import Robot from '../robot';

export default function(robot: Robot) {
  function helpMessage(res: Response) {
    if (!res) return;
    res.send(robot.commands.sort().join('\n') as string);
  }

  robot.respond(/help/i, {}, helpMessage);
};
