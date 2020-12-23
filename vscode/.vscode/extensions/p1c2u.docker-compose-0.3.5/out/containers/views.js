"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const enums_2 = require("../containers/enums");
const views_1 = require("../compose/views");
class ContainerNode extends views_1.ComposeNode {
    // iconPath = {
    // 	light: path.join(__filename, '..', '..', '..', 'resources', 'light'),
    // 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark')
    // };
    constructor(context, container) {
        super(context);
        this.container = container;
    }
    async getChildren() {
        return [];
    }
    async getTreeItem() {
        const item = new vscode_1.TreeItem(this.container.name, vscode_1.TreeItemCollapsibleState.None);
        item.contextValue = enums_1.ResourceType.ExitedContainer;
        var iconPath = this.context.asAbsolutePath('resources/service-exit.png');
        if (this.container.state == enums_2.ContainerState.Up) {
            item.contextValue = enums_1.ResourceType.RunningContainer;
            var iconPath = this.context.asAbsolutePath('resources/service-up-unhealthy.png');
            if (this.container.healthy)
                var iconPath = this.context.asAbsolutePath('resources/service-up-healthy.png');
        }
        item.iconPath = {
            dark: iconPath,
            light: iconPath
        };
        return item;
    }
}
exports.ContainerNode = ContainerNode;
//# sourceMappingURL=views.js.map