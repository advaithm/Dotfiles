'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../containers/enums");
const models_1 = require("../containers/models");
const models_2 = require("../services/models");
class Project {
    constructor(name, dockerExecutor, dockerComposeExecutor) {
        this.name = name;
        this.dockerExecutor = dockerExecutor;
        this.dockerComposeExecutor = dockerComposeExecutor;
        this._services = undefined;
        this._containers = undefined;
    }
    getServices(force = false) {
        if (this._services === undefined || force) {
            this.refreshServices();
        }
        return this._services;
    }
    refreshServices() {
        this._services = this._getServices();
    }
    _getServices() {
        let servicesString = this.dockerComposeExecutor.getConnfigServices();
        let linesString = servicesString.split(/[\r\n]+/g).filter((item) => item);
        let project = this;
        let executor = this.dockerComposeExecutor;
        return linesString.map(function (serviceString, index, array) {
            return new models_2.Service(project, serviceString, executor);
        });
    }
    getContainers(force = false) {
        if (this._containers === undefined || force) {
            this.refreshContainers();
        }
        return this._containers;
    }
    refreshContainers() {
        this._containers = this._getContainers();
    }
    _getContainers() {
        let resultString = this.dockerComposeExecutor.getPs();
        let linesString = resultString.split(/[\r\n]+/g).filter((item) => item);
        // find separator line
        let sepLineIdx = null;
        for (let [idx, lineString] of linesString.entries()) {
            if (lineString.startsWith("---")) {
                sepLineIdx = idx;
                break;
            }
        }
        // process containers lines
        if (sepLineIdx === null)
            return [];
        let containersString = linesString.slice(sepLineIdx + 1);
        let executor = this.dockerExecutor;
        return containersString.map(function (containerString, index, array) {
            const items = containerString.split(/\s{2,}/g).filter((item) => item);
            const name = items[0];
            const command = items[1];
            const state = items[2].startsWith('Up') ? enums_1.ContainerState.Up : enums_1.ContainerState.Exit;
            const healthy = items[2].includes('(healthy)') ? true : items[2].includes('(unhealthy)') ? false : null;
            const ports = items.length == 4 ? items[3].split(', ') : [];
            return new models_1.Container(executor, name, command, state, ports, healthy);
        });
    }
    getContainerServiceName(name) {
        let resultString = this.dockerExecutor.getPs(this.name, name);
        let linesString = resultString.split(/[\r\n]+/g).filter((item) => item);
        return linesString[0];
    }
    getServiceContainers(serviceName) {
        const containers = this.getContainers();
        let projectPattern = this.name + '_';
        let servicePattern = projectPattern + serviceName + '_';
        return containers.filter((container) => {
            // standard container name
            if (container.name.startsWith(projectPattern)) {
                return container.name.includes(servicePattern);
                // custom container name
            }
            else {
                let name = this.getContainerServiceName(container.name);
                return name == serviceName;
            }
        });
    }
    filterServiceContainers(serviceName, containers) {
        let pattern = this.name + '_' + serviceName + '_';
        return containers.filter((container) => {
            return container.name.includes(pattern);
        });
    }
    start() {
        return this.dockerComposeExecutor.start();
    }
    stop() {
        return this.dockerComposeExecutor.stop();
    }
    up() {
        return this.dockerComposeExecutor.up();
    }
    down() {
        return this.dockerComposeExecutor.down();
    }
}
exports.Project = Project;
//# sourceMappingURL=models.js.map