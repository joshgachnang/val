import Robot from '../robot';

export default function (robot: Robot) {
  robot.router.get('/inspirationalQuote', (req, res) => {
    res.json({quotes: robot.config.QUOTES});
  });
}
