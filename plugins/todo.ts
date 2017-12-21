import Response from "../response";
import Robot from "../robot";

export class Todo {
  todoId: number; // required
  text: string; // required
  order: number; // required
  list: string = "default";
  labels: string[] = [];
  due: Date;
  reminder: Date;
  completed: boolean = false;
  completedDate = Date;
  alarmDate = Date;
  removed: boolean = false;

  constructor(data) {
    if (!data.todoId) {
      data.todoId = this.generateTodoId();
    } else {
      this.todoId = data.todoId;
    }
    if (!data.text) throw new Error("text is a required field");
    if (!data.text) throw new Error("order is a required field");
    this.todoId = data.todoId;
    this.text = data.text;
    this.order = data.order;
    this.list = data.list;
    this.labels = data.labels;
    this.due = data.due;
    this.reminder = data.reminder;
    this.completedDate = data.completedDate;
    if (data.completed) {
      this.completed = data.completed;
    } else {
      this.completed = !!this.completedDate;
    }
    this.alarmDate = data.alarmDate;
  }

  generateTodoId() {
    return Math.random()
      .toString(36)
      .slice(2);
  }
}

export default function(robot: Robot) {
  function loadTodos() {
    let todos = {};
    let todoData = robot.brain.get("todos");
    if (!todoData) {
      todoData = [];
    }
    for (let td of Object.values(todoData)) {
      let todo: Todo;
      try {
        todo = new Todo(td);
      } catch (e) {
        robot.logger.warn(`Failed to create todo instance from data: ${td}`);
        continue;
      }
      todos[todo.todoId] = todo;
    }
    return todos;
  }

  function saveTodos(todos) {
    robot.logger.debug(`saving ${Object.keys(todos).length} todos`);
    robot.brain.set("todos", todos);
  }

  function filterTodos(todos: Todo[], key: string, value: any): Todo[] {
    return todos.filter((t) => t[key] === value);
  }

  robot.router.get("/todos", (req, res) => {
    robot.logger.debug("get todos", req.query, req.params);
    let todos = loadTodos();
    if (req.query.completed) {
      todos = filterTodos(Object.values(todos), "completed", JSON.parse(req.query.completed));
    } else {
      todos = Object.values(todos);
    }
    res.json({todo: todos});
  });

  robot.router.post("/todos", (req, res) => {
    robot.logger.debug("[todo] post received");
    let todos = loadTodos();
    for (let todoData of req.body.todos) {
      let todo: Todo;
      try {
        todo = new Todo(todoData);
      } catch (e) {
        robot.logger.warn(`[todo] error in post: ${e.message}`);
        res.status(400).send({error: (<Error>e).message});
        return;
      }
      todos[todo.todoId] = todo;
    }
    robot.logger.debug(`saving todos: ${todos}`);
    saveTodos(todos);
    res.json({data: robot.brain.get("todo")});
  });

  robot.respond(/todos/i, {}, (response: Response) => {
    let todos = loadTodos();
    let incomplete = filterTodos(Object.values(todos), "completed", false);
    let numTodos = incomplete.length;
    let text = incomplete
      .map((t: Todo, i: number) => {
        if (i + 1 === numTodos) {
          return t.text;
        } else {
          return t.text + "\n";
        }
      })
      .join("");

    robot.reply(response.envelope, response.envelope.user, text);
  });
}
