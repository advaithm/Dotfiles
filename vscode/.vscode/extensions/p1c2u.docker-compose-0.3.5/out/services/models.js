'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class Service {
    constructor(project, name, executor) {
        this.project = project;
        this.name = name;
        this.executor = executor;
    }
    getContainers() {
        let containers = this.project.getContainers();
        let pattern = this.project.name + '_' + this.name + '_';
        return containers.filter((container) => {
            return container.name.includes(pattern);
        });
    }
    shell() {
        this.executor.shell(this.name);
    }
    up() {
        return this.executor.up(this.name);
    }
    down() {
        return this.executor.down(this.name);
    }
    start() {
        return this.executor.start(this.name);
    }
    stop() {
        return this.executor.stop(this.name);
    }
    restart() {
        return this.executor.restart(this.name);
    }
    build() {
        return this.executor.build(this.name);
    }
    kill() {
        return this.executor.kill(this.name);
    }
}
exports.Service = Service;
//# sourceMappingURL=models.js.map