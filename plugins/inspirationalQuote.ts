import Robot from '../robot';

let QUOTES = [
  'Woah, looking stylish today',
  'Daaaaaaaayuuuummmm',
  'Nice hair, dude',
  'Stay fresh!',
];

export default function (robot: Robot) {
  robot.router.get('/inspirationalQuote', (req, res) => {
    res.json({quotes: QUOTES});
  });
}
