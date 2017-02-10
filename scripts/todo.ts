import * as process from 'process';
import * as fs from 'fs';

import Todo from '../todo.model';

let DEBUG = false;

interface LocalTodoDataInfo {
  lastOrder: number; // incrementing order operator. Not the number represented in the list
}

interface TodoIndex {
  [s: string]: Todo;
}

class LocalTodoData {
  info: LocalTodoDataInfo;
  todos: TodoIndex;
  plugin: any;

  // TODO: interface for data plugin
  constructor(plugin: any) {
    this.plugin = plugin;
    let data = this.plugin.restore();
    this.info = data.info;
    this.todos = data.todos;
  }

  save() {
    this.plugin.save(this);
  }

  // Util functions
  getActiveTodos(): Todo[] {
    let todos = values(this.todos);
    return todos.filter((todo) => {
      return !todo.completed && !todo.removed;
    });
  }

  sortTodos(todos: Todo[]): Todo[] {
    return todos.sort((a, b) => { return a.order - b.order });
  }
}

let apiPlugin = {
  save: function() {

  },
  restore: function() {

  }
}

let localPlugin = {
  save: function(data: LocalTodoData) {
    fs.writeFileSync('todo.json', JSON.stringify(data, null, 2))
  },
  restore: function() {
    let restoredData = {info: {lastOrder: 0}, todos: {}};
    let jsonData = JSON.parse(fs.readFileSync('todo.json', 'utf-8'));
    restoredData.info = jsonData.info;

    log('stored todos', jsonData.todos);
    for (let todoId in jsonData.todos) {
      let jsonTodo = jsonData.todos[todoId];
      log('json todo', jsonTodo)
      let todo = new Todo(jsonTodo);
      restoredData.todos[todo.todoId] = todo;
    }
    return restoredData;
  }
}

// Command functions

let commands = {
  'add': add,
  'a': add,
  'do': complete,
  'd': complete,
  'rm': remove,
  'r': remove,
  'l': list,
  'list': list,
}

function add(args: string, data: LocalTodoData) {
  let todo = new Todo({text: args, order: data.info.lastOrder + 1});
  data.info.lastOrder += 1;
  data.todos[todo.todoId] = todo;
  data.save();
}

function list(args: string, data: LocalTodoData) {
  let actives = data.sortTodos(data.getActiveTodos());

  let i = 1;
  for (let todo of actives) {
    console.log(`${i}: ${todo.text}`);
    i++;
  }
}

function complete(args: string) {

}

function remove(args: string) {

}

// Util functions
function values(data: {}) {
  return Object.keys(data).map(k => data[k])
}

function log(...s: any[]) {
  if (DEBUG) {
    console.log(s)
  }
}


// CLI

function usage() {
  console.log(`Available commands: ${Object.keys(commands)}`);
}

function main() {
  let plugin = localPlugin;
  let data = new LocalTodoData(plugin);

  let args = process.argv.slice(2).join(' ');
  let command = args.split(" ")[0];
  let func = commands[command];
  if (!func) {
    return usage();
  }
  func(args.split(' ').slice(1).join(' '), data);
}
main();
