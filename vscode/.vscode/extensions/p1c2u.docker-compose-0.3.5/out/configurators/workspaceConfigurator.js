"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class WorkspaceConfigurator {
    static getConfiguration() {
        return vscode.workspace.getConfiguration("docker-compose");
    }
}
exports.WorkspaceConfigurator = WorkspaceConfigurator;
//# sourceMappingURL=workspaceConfigurator.js.map