"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const models_1 = require("../projects/models");
const views_1 = require("../projects/views");
const dockerExecutor_1 = require("../executors/dockerExecutor");
const dockerComposeExecutor_1 = require("../executors/dockerComposeExecutor");
class AutoRefreshTreeDataProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeAutoRefresh = new vscode_1.EventEmitter();
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.autoRefreshEnabled = true;
    }
    get onDidChangeAutoRefresh() {
        return this._onDidChangeAutoRefresh.event;
    }
    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event;
    }
    setAutoRefresh(interval) {
        if (interval > 0) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setInterval(() => {
                if (this.autoRefreshEnabled)
                    this.refresh();
            }, interval);
        }
    }
    async refresh(root) {
        this._onDidChangeTreeData.fire();
    }
    disableAutoRefresh() {
        this.autoRefreshEnabled = false;
    }
    enableAutoRefresh() {
        this.autoRefreshEnabled = true;
    }
}
exports.AutoRefreshTreeDataProvider = AutoRefreshTreeDataProvider;
class DockerComposeProvider extends AutoRefreshTreeDataProvider {
    constructor(context, files, shell, projectNames) {
        super(context);
        this.files = files;
        this.shell = shell;
        this.projectNames = projectNames;
        let projects = [];
        if (vscode.workspace && vscode.workspace.workspaceFolders) {
            projects = vscode.workspace.workspaceFolders.map((folder) => {
                // project name from mapping or use workspace dir name
                let name = projectNames[folder.index] || folder.name.replace(/[^-_a-z0-9]/gi, '');
                let dockerExecutor = new dockerExecutor_1.DockerExecutor(shell, folder.uri.fsPath);
                let dockerComposeExecutor = new dockerComposeExecutor_1.DockerComposeExecutor(name, files, shell, folder.uri.fsPath);
                return new models_1.Project(name, dockerExecutor, dockerComposeExecutor);
            });
        }
        this._root = new views_1.ProjectsNode(this.context, projects);
    }
    getRefreshCallable(node) {
        let that = this;
        async function refresh() {
            await that.refresh(node);
        }
        return refresh;
    }
    async getChildren(node) {
        if (this._loading !== undefined) {
            await this._loading;
            this._loading = undefined;
        }
        if (node === undefined)
            node = this._root;
        try {
            return await node.getChildren();
        }
        catch (err) {
            vscode_1.window.showErrorMessage("Docker Compose Error: " + err.message);
            return node.handleError(err);
        }
    }
    async getTreeItem(node) {
        return node.getTreeItem();
    }
    async startProject(node) {
        return node.project.start();
    }
    async stopProject(node) {
        return node.project.stop();
    }
    async upProject(node) {
        let child_process = node.project.up();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async downProject(node) {
        let child_process = node.project.down();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async shellService(node) {
        node.service.shell();
    }
    async upService(node) {
        let child_process = node.service.up();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async downService(node) {
        let child_process = node.service.down();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async buildService(node) {
        let child_process = node.service.build();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async startService(node) {
        let child_process = node.service.start();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async stopService(node) {
        let child_process = node.service.stop();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async restartService(node) {
        let child_process = node.service.restart();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async killService(node) {
        let child_process = node.service.kill();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async attachContainer(node) {
        node.container.attach();
    }
    async logsContainer(node) {
        var setting = vscode_1.Uri.parse("untitled:" + node.container.name + ".logs");
        var content = node.container.logs();
        vscode.workspace.openTextDocument(setting).then((doc) => {
            vscode_1.window.showTextDocument(doc, 1, false).then(editor => {
                editor.edit(edit => {
                    edit.insert(new vscode_1.Position(0, 0), content);
                });
            });
        });
    }
    async startContainer(node) {
        let child_process = node.container.start();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async stopContainer(node) {
        let child_process = node.container.stop();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async killContainer(node) {
        let child_process = node.container.kill();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
}
exports.DockerComposeProvider = DockerComposeProvider;
//# sourceMappingURL=providers.js.map