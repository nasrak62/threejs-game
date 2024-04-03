import EventHandler from '../event_handler';
import { TStateInit } from './types';

export default class State extends EventHandler {
    action: Function;

    constructor({ eventName, action }: TStateInit) {
        super({ eventName });
        
        this.on(action)
    }

    start() {
        this.action();
    }
}
