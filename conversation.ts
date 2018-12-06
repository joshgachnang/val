import Robot from "./robot";
import Response from "./response";

const MAX_MESSAGES_PER_CONVERSATION = 100;

export class ConversationBrain {
  robot: Robot;
  conversations: {[userId: string]: Response[]} = {};

  constructor(robot: Robot) {
    this.robot = robot;
  }

  public addToConversation(response: Response): void {
    if (!response.message || !response.message.user || !response.message.user.id) {
      this.robot.logger.warn(`[conversation] attempted to add response with no user`, response);
      return;
    }

    const userId = response.message.user.id;
    if (!this.conversations[userId]) {
      this.conversations[userId] = [];
    }
    this.conversations[userId].push(response);
    if (this.conversations[userId].length > MAX_MESSAGES_PER_CONVERSATION) {
      this.conversations[userId].shift();
    }
  }

  // Async because this may move to the DB for scaling in the future. And it doesn't hurt.
  public async getConversationForUser(userId: string): Promise<Response[]> {
    return this.conversations[userId] || [];
  }
}
