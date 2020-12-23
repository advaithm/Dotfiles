"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTerminalLaunchCommands = exports.isWindows = void 0;
const vscode = require("vscode");
exports.isWindows = process.platform === "win32";
function isPowershell() {
    return vscode.env.shell.search(/(powershell|pwsh)/i) !== -1;
}
function getTerminalLaunchCommands(command) {
    if (exports.isWindows) {
        if (isPowershell()) {
            return [`cmd /c ${command}`, "clear"];
        }
        else {
            return [`${command}`, "cls"];
        }
    }
    else {
        return [command, "clear"];
    }
}
exports.getTerminalLaunchCommands = getTerminalLaunchCommands;
//# sourceMappingURL=utils.js.map