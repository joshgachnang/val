import {Message} from './message';
import Room from './room';
import User from './user';

export default class Envelope {
  room: Room;
  user: User;
  message: Message;
  adapterName: string;

  constructor(room: Room, user: User, message: Message, adapterName: string) {
    if (!room || !user || !message || !adapterName) {
       throw new Error(`Envelope requires all fields: room: ${room}
         user: ${user} message: ${message} adapterName: ${adapterName}`);
     }
     this.room = room;
     this.user = user;
     this.message = message;
     this.adapterName = adapterName;
  }
}
