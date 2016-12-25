export default class User {
    name: string;
    id: string;

    constructor(id, data) {
        this.name = data.name;
    }
}
