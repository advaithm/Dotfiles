"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const exceptions_1 = require("../executors/exceptions");
const views_1 = require("../explorers/views");
class MessageNode extends views_1.ExplorerNode {
    constructor(context, message) {
        super(context);
        this.context = context;
        this.message = message;
    }
    getChildren() {
        return [];
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(this.message, vscode_1.TreeItemCollapsibleState.None);
        item.contextValue = enums_1.ResourceType.Message;
        return item;
    }
    handleError(err) {
        return [];
    }
}
exports.MessageNode = MessageNode;
class ComposeNode extends views_1.ExplorerNode {
    handleError(err) {
        if (err instanceof exceptions_1.ComposeFileNotFound) {
            return [new MessageNode(this.context, 'No docker compose file(s)')];
        }
        else if (err instanceof exceptions_1.DockerComposeCommandNotFound) {
            return [new MessageNode(this.context, 'docker-compose command not found')];
        }
        else if (err instanceof exceptions_1.DockerComposeExecutorError) {
            return [new MessageNode(this.context, 'Failed to execute script docker-compose')];
        }
        else {
            return [new MessageNode(this.context, 'unexpected error')];
        }
    }
}
exports.ComposeNode = ComposeNode;
//# sourceMappingURL=views.js.map