export default class Todo {
  id: number; // required
  text: string; // required
  order: number; // required
  list: string = "default";
  labels: string[] = [];
  due: Date;
  reminder: Date;
  completed: boolean = false;
  removed: boolean = false;
  todoId: string;

  constructor(data) {
    if (!data.id) {
      data.id = this.generateTodoId();
    } else {
      this.id = data.id;
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
  }

  generateTodoId() {
    return Math.random()
      .toString(36)
      .slice(2);
  }
}
