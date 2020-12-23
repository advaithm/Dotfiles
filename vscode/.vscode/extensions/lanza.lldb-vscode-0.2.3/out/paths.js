"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const process = require("process");
const assert_1 = require("assert");
function getLLDBPath() {
    const root = vscode.extensions.getExtension("lanza.lldb-vscode")
        .extensionPath;
    switch (process.platform) {
        case "win32":
            return root + "/bin/windows/lldb-vscode.exe";
        case "darwin":
            return root + "/bin/darwin/bin/lldb-vscode";
        case "linux":
            return root + "/bin/linux/bin/lldb-vscode";
        default:
            assert_1.fail("Invalid operating system");
            return "";
    }
}
exports.getLLDBPath = getLLDBPath;
//# sourceMappingURL=paths.js.map