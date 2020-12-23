"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const views_1 = require("../services/views");
const views_2 = require("../compose/views");
class ProjectNode extends views_2.ComposeNode {
    constructor(context, project) {
        super(context);
        this.project = project;
    }
    async getChildren() {
        this.resetChildren();
        let services;
        this.project.refreshContainers();
        services = this.project.getServices();
        this.children = services
            .map(service => new views_1.ServiceNode(this.context, service));
        return this.children;
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(this.project.name, vscode_1.TreeItemCollapsibleState.Expanded);
        item.contextValue = enums_1.ResourceType.Project;
        return item;
    }
}
exports.ProjectNode = ProjectNode;
class ProjectsNode extends views_2.ComposeNode {
    constructor(context, projects) {
        super(context);
        this.projects = projects;
    }
    async getChildren() {
        this.resetChildren();
        this.children = this.projects
            .map(project => new ProjectNode(this.context, project));
        return this.children;
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(`Projects`, vscode_1.TreeItemCollapsibleState.Expanded);
        item.contextValue = enums_1.ResourceType.Projects;
        return item;
    }
}
exports.ProjectsNode = ProjectsNode;
//# sourceMappingURL=views.js.map