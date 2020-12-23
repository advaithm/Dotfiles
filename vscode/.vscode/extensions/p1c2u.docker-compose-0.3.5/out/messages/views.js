"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
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
}
exports.MessageNode = MessageNode;
//# sourceMappingURL=views.js.map