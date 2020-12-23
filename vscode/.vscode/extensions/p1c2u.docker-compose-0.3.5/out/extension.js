'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appInsightsClient_1 = require("./telemetry/appInsightsClient");
const nullClient_1 = require("./telemetry/nullClient");
const workspaceConfigurator_1 = require("./configurators/workspaceConfigurator");
const providers_1 = require("./explorers/providers");
function activate(context) {
    const configuration = workspaceConfigurator_1.WorkspaceConfigurator.getConfiguration();
    const interval = workspaceConfigurator_1.WorkspaceConfigurator.getConfiguration().get("autoRefreshInterval");
    const files = configuration.get("files");
    const shell = configuration.get("shell");
    const projectNames = configuration.get("projectNames");
    const isTelemetryEnabled = configuration.get("enableTelemetry");
    const telemetryClient = isTelemetryEnabled ? new appInsightsClient_1.AppInsightsClient("1234-1234-1234-1234") : new nullClient_1.NullClient();
    const provider = new providers_1.DockerComposeProvider(context, files, shell, projectNames);
    provider.setAutoRefresh(interval);
    vscode.window.registerTreeDataProvider("dockerCompose", provider);
    telemetryClient.sendEvent("loadExtension");
    let refreshExplorer = vscode.commands.registerCommand("docker-compose.explorer.refresh", () => {
        provider.refresh();
        telemetryClient.sendEvent("refreshExplorer");
    });
    let shellService = vscode.commands.registerCommand("docker-compose.service.shell", (node) => {
        provider.shellService(node);
        telemetryClient.sendEvent("shellService");
    });
    let startProject = vscode.commands.registerCommand("docker-compose.project.start", (node) => {
        provider.startProject(node);
        telemetryClient.sendEvent("startProject");
    });
    let stopProject = vscode.commands.registerCommand("docker-compose.project.stop", (node) => {
        provider.stopProject(node);
        telemetryClient.sendEvent("stopProject");
    });
    let upProject = vscode.commands.registerCommand("docker-compose.project.up", (node) => {
        provider.upProject(node);
        telemetryClient.sendEvent("upProject");
    });
    let downProject = vscode.commands.registerCommand("docker-compose.project.down", (node) => {
        provider.downProject(node);
        telemetryClient.sendEvent("downProject");
    });
    let upService = vscode.commands.registerCommand("docker-compose.service.up", (node) => {
        provider.upService(node);
        telemetryClient.sendEvent("upService");
    });
    let downService = vscode.commands.registerCommand("docker-compose.service.down", (node) => {
        provider.downService(node);
        telemetryClient.sendEvent("downService");
    });
    let startService = vscode.commands.registerCommand("docker-compose.service.start", (node) => {
        provider.startService(node);
        telemetryClient.sendEvent("startService");
    });
    let stopService = vscode.commands.registerCommand("docker-compose.service.stop", (node) => {
        provider.stopService(node);
        telemetryClient.sendEvent("stopService");
    });
    let restartService = vscode.commands.registerCommand("docker-compose.service.restart", (node) => {
        provider.restartService(node);
        telemetryClient.sendEvent("restartService");
    });
    let buildService = vscode.commands.registerCommand("docker-compose.service.build", (node) => {
        provider.buildService(node);
        telemetryClient.sendEvent("buildService");
    });
    let killService = vscode.commands.registerCommand("docker-compose.service.kill", (node) => {
        provider.killService(node);
        telemetryClient.sendEvent("killService");
    });
    let attachContainer = vscode.commands.registerCommand("docker-compose.container.attach", (node) => {
        provider.attachContainer(node);
        telemetryClient.sendEvent("attachContainer");
    });
    let logsContainer = vscode.commands.registerCommand("docker-compose.container.logs", (node) => {
        provider.logsContainer(node);
        telemetryClient.sendEvent("logsContainer");
    });
    let startContainer = vscode.commands.registerCommand("docker-compose.container.start", (node) => {
        provider.startContainer(node);
        telemetryClient.sendEvent("startContainer");
    });
    let stopContainer = vscode.commands.registerCommand("docker-compose.container.stop", (node) => {
        provider.stopContainer(node);
        telemetryClient.sendEvent("stopContainer");
    });
    let killContainer = vscode.commands.registerCommand("docker-compose.container.kill", (node) => {
        provider.killContainer(node);
        telemetryClient.sendEvent("killContainer");
    });
    context.subscriptions.push(upProject);
    context.subscriptions.push(downProject);
    context.subscriptions.push(startProject);
    context.subscriptions.push(stopProject);
    context.subscriptions.push(shellService);
    context.subscriptions.push(upService);
    context.subscriptions.push(downService);
    context.subscriptions.push(startService);
    context.subscriptions.push(stopService);
    context.subscriptions.push(restartService);
    context.subscriptions.push(buildService);
    context.subscriptions.push(killService);
    context.subscriptions.push(attachContainer);
    context.subscriptions.push(logsContainer);
    context.subscriptions.push(startContainer);
    context.subscriptions.push(stopContainer);
    context.subscriptions.push(killContainer);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map