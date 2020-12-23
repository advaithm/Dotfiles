"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandExecutor_1 = require("./commandExecutor");
const exceptions_1 = require("./exceptions");
class DockerComposeExecutor extends commandExecutor_1.CommandExecutor {
    constructor(name, files, shell = "/bin/sh", cwd = null) {
        super(cwd, { COMPOSE_PROJECT_NAME: name });
        this._files = files;
        this._shell = shell;
    }
    getBaseCommand() {
        return this._files.reduce((myString, files) => myString + ' -f ' + files, 'docker-compose');
    }
    getShellCommand() {
        return this._shell;
    }
    getConnfigServices() {
        let configServicesCommand = `config --services`;
        return this.executeSync(configServicesCommand);
    }
    getPs() {
        let composeCommand = `ps`;
        return this.executeSync(composeCommand);
    }
    shell(serviceName) {
        let shellCommand = this.getShellCommand();
        let composeCommand = `exec ${serviceName} ${shellCommand}`;
        let terminalName = `${serviceName} shell`;
        this.runInTerminal(composeCommand, true, terminalName);
    }
    up(serviceName) {
        let composeCommand = serviceName === undefined ? `up --no-recreate` : `up --no-recreate ${serviceName}`;
        return this.execute(composeCommand);
    }
    down(serviceName) {
        let composeCommand = serviceName === undefined ? `down` : `down ${serviceName}`;
        return this.execute(composeCommand);
    }
    start(serviceName) {
        let composeCommand = serviceName === undefined ? `start` : `start ${serviceName}`;
        return this.execute(composeCommand);
    }
    stop(serviceName) {
        let composeCommand = serviceName === undefined ? `stop` : `stop ${serviceName}`;
        return this.execute(composeCommand);
    }
    restart(serviceName) {
        let composeCommand = `restart ${serviceName}`;
        return this.execute(composeCommand);
    }
    build(serviceName) {
        let composeCommand = `build --no-cache ${serviceName}`;
        return this.execute(composeCommand);
    }
    kill(serviceName) {
        let composeCommand = `kill ${serviceName}`;
        return this.execute(composeCommand);
    }
    executeSync(composeCommand) {
        try {
            return super.executeSync(composeCommand);
        }
        catch (err) {
            if (err.message.includes("No such file"))
                throw new exceptions_1.ComposeFileNotFound(err.message, err.output);
            else if (err.message.includes("'docker-compose' is not recognized"))
                throw new exceptions_1.DockerComposeCommandNotFound(err.message, err.output);
            else
                throw new exceptions_1.DockerComposeExecutorError(err.message, err.output);
        }
    }
}
exports.DockerComposeExecutor = DockerComposeExecutor;
//# sourceMappingURL=dockerComposeExecutor.js.map