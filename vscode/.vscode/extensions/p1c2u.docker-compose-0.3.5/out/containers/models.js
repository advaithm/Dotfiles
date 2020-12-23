"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Container {
    constructor(executor, name, command, state, ports, healthy = false) {
        this.executor = executor;
        this.name = name;
        this.command = command;
        this.state = state;
        this.ports = ports;
        this.healthy = healthy;
    }
    attach() {
        this.executor.attach(this.name);
    }
    logs() {
        return this.executor.logs(this.name);
    }
    start() {
        return this.executor.start(this.name);
    }
    stop() {
        return this.executor.stop(this.name);
    }
    kill() {
        return this.executor.kill(this.name);
    }
}
exports.Container = Container;
//# sourceMappingURL=models.js.map