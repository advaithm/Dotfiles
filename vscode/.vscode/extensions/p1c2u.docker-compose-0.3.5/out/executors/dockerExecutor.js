"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandExecutor_1 = require("./commandExecutor");
class DockerExecutor extends commandExecutor_1.CommandExecutor {
    constructor(shell = "/bin/sh", cwd = null) {
        super(cwd);
        this._shell = shell;
    }
    getBaseCommand() {
        return 'docker';
    }
    getShellCommand() {
        return this._shell;
    }
    getPs(projectName, containerName) {
        let dockerCommand = `ps -a --format '{{.Label "com.docker.compose.service"}}' --filter name=${containerName} --filter label=com.docker.compose.project=${projectName}`;
        return this.executeSync(dockerCommand);
    }
    attach(name) {
        let dockerCommand = `attach ${name}`;
        this.runInTerminal(dockerCommand, true, name);
    }
    logs(name) {
        let dockerCommand = `logs ${name}`;
        return this.executeSync(dockerCommand);
    }
    start(name) {
        let dockerCommand = `start ${name}`;
        return this.execute(dockerCommand);
    }
    stop(name) {
        let dockerCommand = `stop ${name}`;
        return this.execute(dockerCommand);
    }
    kill(name) {
        let dockerCommand = `kill ${name}`;
        return this.execute(dockerCommand);
    }
}
exports.DockerExecutor = DockerExecutor;
//# sourceMappingURL=dockerExecutor.js.map