export default class StateManager {
    constructor({ states }) {
        this.states = states;
        this.currentState = this.states[0];
    }

    start() {
        for (let index = 0; index < this.states.length; index++) {
            const state = this.states[index];
            const nextState = this.states[index + 1];

            state.on(() => {
                nextState.emit()
            })
        }
       
    }
}
