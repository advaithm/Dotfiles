"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DockerComposeExecutorError extends Error {
    constructor(message, output) {
        super();
        this.message = message;
        this.output = output;
    }
}
exports.DockerComposeExecutorError = DockerComposeExecutorError;
class DockerComposeCommandNotFound extends DockerComposeExecutorError {
}
exports.DockerComposeCommandNotFound = DockerComposeCommandNotFound;
class ComposeFileNotFound extends DockerComposeExecutorError {
}
exports.ComposeFileNotFound = ComposeFileNotFound;
//# sourceMappingURL=exceptions.js.map