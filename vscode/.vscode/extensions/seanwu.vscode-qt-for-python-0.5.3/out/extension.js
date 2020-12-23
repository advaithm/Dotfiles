"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const child_process = require("child_process");
const util = require("util");
const vscode = require("vscode");
const variableResolver_1 = require("./variableResolver");
let outputChannel;
let rootPath;
if (vscode.workspace.workspaceFolders) {
    rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
}
else {
    rootPath = undefined;
}
let variableResolver = new variableResolver_1.VariableResolver();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors
    // (console.error).
    // This line of code will only be executed once when your extension is
    // activated.
    outputChannel = vscode.window.createOutputChannel('Qt for Python');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.newForm', (fileUri) => {
        const toolPath = vscode.workspace.getConfiguration('qtForPython.path').get('designer');
        if (toolPath) {
            if (fileUri) { // from explorer/context menus
                exec(toolPath, { cwd: fileUri.fsPath });
            }
            else { // from command palette
                exec(toolPath);
            }
        }
        else {
            showPathNotExist('Qt Designer');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.editForm', (fileUri) => {
        useTool('designer', 'Qt Design', fileUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.compileForm', (fileUri) => {
        useTool('pyuic', 'Python UI Compiler', fileUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.updateTranslation', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        vscode.window.showInformationMessage(`Trying to open Python lupdate Tool`);
        let toolPath = vscode.workspace.getConfiguration('qtForPython.path').get('pylupdate');
        if (toolPath) {
            // Get -ts ts-files from toolPath.
            const tsFileArgRegex = /\s+\-ts\s+\S+\b/g;
            const tsFileArg = toolPath.match(tsFileArgRegex);
            if (tsFileArg) {
                // Remove "-ts ts-files" from toolPath.
                toolPath = toolPath.replace(tsFileArgRegex, '');
                if (fileUri) { // from explorer/context menus
                    // Move "-ts ts-files" behind the fileUri.
                    exec(`${toolPath} "${fileUri.fsPath}" ${tsFileArg}`);
                }
                else { // from command palette
                    const activeTextEditor = vscode.window.activeTextEditor;
                    if (activeTextEditor) {
                        const documentUri = activeTextEditor.document.uri;
                        // Move "-ts ts-files" behind the fileUri.
                        exec(`${toolPath} "${documentUri.fsPath}"  ${tsFileArg}`);
                    }
                }
            }
            else {
                const response = yield vscode.window.showErrorMessage('The output location of TS file is required. Add ' +
                    '"-ts ts-filename" to the path of pylupdate.', 'Setting');
                if (response === 'Setting') {
                    vscode.commands.executeCommand('workbench.action.openSettings');
                }
            }
        }
        else {
            showPathNotExist('Python lupdate Tool');
        }
    })));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.editTranslation', (fileUri) => {
        useTool('linguist', 'Qt Linguist', fileUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.releaseTranslation', (fileUri) => {
        useTool('lrelease', 'Qt lrelease', fileUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.previewQml', (fileUri) => {
        useTool('qmlscene', 'QML Scene', fileUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qtForPython.compileResource', (fileUri) => {
        useTool('pyrcc', 'Python Resource Compiler', fileUri);
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
function useTool(id, name, targetUri) {
    vscode.window.showInformationMessage(`Trying to open ${name}`);
    const toolPath = vscode.workspace.getConfiguration('qtForPython.path').get(id);
    if (toolPath) {
        if (targetUri) { // from explorer/context menus
            exec(`${toolPath} "${targetUri.fsPath}"`);
        }
        else { // from command palette
            const activeTextEditor = vscode.window.activeTextEditor;
            if (activeTextEditor) {
                const documentUri = activeTextEditor.document.uri;
                exec(`${toolPath} "${documentUri.fsPath}"`);
            }
        }
    }
    else {
        showPathNotExist(name);
    }
}
function showPathNotExist(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield vscode.window.showErrorMessage(`${name} not found. Set the path of ${name} in Qt for Python section in`
            + 'the user setting.', 'Setting');
        if (response === 'Setting') {
            vscode.commands.executeCommand('workbench.action.openSettings');
        }
    });
}
function exec(command, options = { cwd: rootPath }) {
    return __awaiter(this, void 0, void 0, function* () {
        let output;
        let resolvedCommand = variableResolver.resolve(command);
        outputChannel.appendLine(`[INFO] Running command: ${resolvedCommand}`);
        try {
            output = yield util.promisify(child_process.exec)(resolvedCommand, options);
        }
        catch (err) {
            vscode.window.showErrorMessage(err.message);
            outputChannel.appendLine(`[ERROR] ${err.message}`);
            outputChannel.show();
        }
        if (output && output.stdout) {
            outputChannel.appendLine(output.stdout.toString());
            outputChannel.show();
        }
        else if (output && output.stderr) {
            outputChannel.appendLine(`[ERROR] ${output.stderr.toString()}`);
            outputChannel.show();
        }
        return output;
    });
}
//# sourceMappingURL=extension.js.map