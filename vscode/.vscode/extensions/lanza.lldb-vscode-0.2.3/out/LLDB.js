"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const paths = require("./paths");
const Net = require("net");
const LLDBVSCODE_CONNECTION_RETRY_TIME_MS = 100;
const LLDBVSCODE_CONNECTION_TIMEOUT_MS = 2000;
const LLDBVSCODE_CONNECTION_MAX_ATTEMPS = LLDBVSCODE_CONNECTION_TIMEOUT_MS / LLDBVSCODE_CONNECTION_RETRY_TIME_MS;
class LLDB {
    constructor(port, terminal, logger) {
        this.port = port;
        this.terminal = terminal;
        this.logger = logger;
    }
    dispose() {
        this.terminal.dispose();
    }
    connect() {
        return new Promise((resolve, reject) => {
            const tryConnect = (attempt) => {
                setTimeout(() => {
                    const socket = new Net.Socket();
                    socket.on("connect", () => {
                        this.logger.appendLine("[lldb-socket] Connection established");
                        resolve(socket);
                    });
                    socket.on("error", err => {
                        this.logger.appendLine("[lldb-socket] Connection attempt failed with error " +
                            (err && err.message));
                        if (attempt === LLDBVSCODE_CONNECTION_MAX_ATTEMPS) {
                            reject(err);
                        }
                        tryConnect(attempt + 1);
                    });
                    socket.connect({ port: this.port, host: "127.0.0.1" });
                }, LLDBVSCODE_CONNECTION_RETRY_TIME_MS);
            };
            tryConnect(1);
        });
    }
}
exports.LLDB = LLDB;
function spawnLLDBVSCode(logger) {
    const lldbPort = Math.floor(Math.random() * 45000) + 20000;
    const lldbVSCodeTerminal = vscode.window.createTerminal("lldb-vscode", paths.getLLDBPath(), [lldbPort.toString()]);
    lldbVSCodeTerminal.show();
    return new LLDB(lldbPort, lldbVSCodeTerminal, logger);
}
exports.spawnLLDBVSCode = spawnLLDBVSCode;
//# sourceMappingURL=LLDB.js.map