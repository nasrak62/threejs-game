import { TEventHandlerInit } from './types';

export default class EventHandler {
    eventName: string;

    constructor({ eventName }: TEventHandlerInit) {
        this.eventName = eventName;
    }

    emit() {
        window.dispatchEvent(new Event(this.eventName));
    }

    on(callback: EventListenerOrEventListenerObject) {
        window.addEventListener(this.eventName, callback);
    }

    remove(callback: EventListenerOrEventListenerObject) {
        window.removeEventListener(this.eventName, callback);
    }
}
