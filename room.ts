export default class Room {
  name: string;
  id?: string;
  isDirectMessage: boolean;

  constructor(name: string, id?: string, isDirectMessage: boolean = false) {
    this.name = name;
    this.id = id;
    this.isDirectMessage = isDirectMessage;
  }
}
