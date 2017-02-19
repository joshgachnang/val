import Robot from '../robot';
import Todo from '../todo.model';

export default function(robot: Robot) {

  robot.router.get('/todo', (req, res) => {
    robot.logger.debug('get todo');
    res.json({data: robot.brain.get('todo')});
  });

  robot.router.post('/todo', (req, res) => {
    let body = req.json();
    let todos = [];
    for (let todoData of body.todos) {
      let todo: Todo;
      try {
        todo = new Todo(todoData);
      } catch (e) {
        res.statusCode(400).send({error: (<Error>e).message});
        return;
      }
      todos.push(todo);
    }
    robot.logger.debug('saving todos', body);
    robot.brain.set('todo', body);
    res.json({data: robot.brain.get('todo')});
  });
}
