"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandExecutor_1 = require("./commandExecutor");
const exceptions_1 = require("./exceptions");
class DockerComposeCommandExecutor extends commandExecutor_1.CommandExecutor {
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
        let command = this.getBaseCommand();
        let configServicesCommand = `${command} config --services`;
        return this.execSync(configServicesCommand);
    }
    getPs() {
        let command = this.getBaseCommand();
        let composeCommand = `${command} ps`;
        return this.execSync(composeCommand);
    }
    shell(serviceName) {
        let command = this.getBaseCommand();
        let shellCommand = this.getShellCommand();
        let composeCommand = `${command} exec ${serviceName} ${shellCommand}`;
        let terminalName = `${serviceName} shell`;
        this.runInTerminal(composeCommand, true, terminalName);
    }
    up(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = serviceName === undefined ? `${command} up --no-recreate` : `${command} up --no-recreate ${serviceName}`;
        return this.exec(composeCommand);
    }
    down(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = serviceName === undefined ? `${command} down` : `${command} down ${serviceName}`;
        return this.exec(composeCommand);
    }
    start(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = serviceName === undefined ? `${command} start` : `${command} start ${serviceName}`;
        return this.exec(composeCommand);
    }
    stop(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = serviceName === undefined ? `${command} stop` : `${command} stop ${serviceName}`;
        return this.exec(composeCommand);
    }
    restart(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = `${command} restart ${serviceName}`;
        return this.exec(composeCommand);
    }
    build(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = `${command} build --no-cache ${serviceName}`;
        return this.exec(composeCommand);
    }
    kill(serviceName) {
        let command = this.getBaseCommand();
        let composeCommand = `${command} kill ${serviceName}`;
        return this.exec(composeCommand);
    }
    execSync(command) {
        try {
            return super.execSync(command);
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
exports.DockerComposeCommandExecutor = DockerComposeCommandExecutor;
//# sourceMappingURL=dockerComposeCommandExecutor.js.map