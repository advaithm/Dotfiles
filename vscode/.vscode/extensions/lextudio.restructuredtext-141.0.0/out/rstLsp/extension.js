"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./../features/utils/configuration");
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const docLinkProvider_1 = require("./docLinkProvider");
const open = require("open");
const mime = require("mime");
const vscode_1 = require("vscode");
async function activate(context, logger, disabled, python) {
    if (disabled) {
        return;
    }
    if (!(await python.checkPython(null, false)) || !(await python.checkPythonForSnooty())) {
        vscode.window.showErrorMessage('Python version is too old to run Snooty language server. Must use 3.7 and above.');
        return;
    }
    // Notify the user that if they change a snooty setting they need to restart
    // vscode.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        // TODO:
    }));
    let serverModule = await configuration_1.Configuration.getPythonPath();
    let args = [];
    let options = {};
    const sourceFolder = configuration_1.Configuration.getSnootySourceFolder();
    if (sourceFolder) {
        logger.telemetry('Snooty from source');
        // launch language server from source folder.
        options.cwd = sourceFolder;
        if (await python.checkPython(null, false) && await python.checkSnooty(null, false, false)) {
            await python.uninstallSnooty();
            vscode.window.showInformationMessage('Uninstalled snooty-lextudio.');
        }
        if (!(await python.checkPython(null, false)) || !(await python.checkDebugPy(null, true))) {
            return;
        }
        args.push('-m', 'debugpy', '--listen', '5678');
        if (configuration_1.Configuration.getSnootyDebugLaunch()) {
            args.push('--wait-for-client');
        }
        vscode.window.showInformationMessage('debugpy is at port 5678. Connect and debug.');
    }
    else {
        if (!(await python.checkPython(null, false)) || !(await python.checkSnooty(null, true, true))) {
            return;
        }
    }
    logger.log('Use Snooty language server');
    logger.telemetry('Snooty language server');
    args.push('-m', 'snooty', 'language-server');
    if (serverModule != null) {
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        let serverOptions = {
            run: { command: serverModule, args: args, options: options },
            debug: { command: serverModule, args: args, options: options }
        };
        const documentSelector = [
            { language: 'plaintext', scheme: 'file' },
            { language: 'yaml', scheme: 'file' },
            { language: 'restructuredtext', scheme: 'file' },
            { language: 'toml', scheme: 'file' },
        ];
        // Options to control the language client
        let clientOptions = {
            // Register the server for plain text documents
            documentSelector,
            synchronize: {
                // Synchronize the setting section 'lspSample' to the server
                configurationSection: 'snooty',
                // Notify the server about file changes to '.clientrc' files contain in the workspace
                fileEvents: [
                    vscode.workspace.createFileSystemWatcher('**/*.rst'),
                    vscode.workspace.createFileSystemWatcher('**/*.txt'),
                    vscode.workspace.createFileSystemWatcher('**/*.yaml'),
                    vscode.workspace.createFileSystemWatcher('snooty.toml')
                ]
            }
        };
        const client = new vscode_languageclient_1.LanguageClient('Snooty Language Client', serverOptions, clientOptions);
        const restartServer = vscode.commands.registerCommand('snooty.restart', async () => {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
        (() => {
            let config = vscode_1.workspace.getConfiguration('snooty');
            let statusStyle = config.get('misc.status', 'short');
            if (statusStyle == 'short' || statusStyle == 'detailed') {
                let statusIcon = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right);
                statusIcon.command = 'snooty.restart';
                statusIcon.text = 'snooty: loading';
                statusIcon.tooltip =
                    'Click to reload window and restart Snooty language server';
                statusIcon.show();
                client.onReady().then(() => {
                    statusIcon.text = 'snooty: idle';
                    // TODO:
                    // languageClient.onNotification('$snooty/progress', (args) => {
                    // });
                });
            }
        })();
        // Push the disposable to the context's subscriptions so that the
        // client can be deactivated on extension deactivation
        context.subscriptions.push(client.start());
        context.subscriptions.push(restartServer);
        // Register custom command to allow includes, literalincludes, and figures to be clickable
        let hoverFile;
        const clickInclude = vscode.commands.registerCommand('snooty.clickInclude', async () => {
            // Send request to server (snooty-parser)
            const type = mime.getType(hoverFile);
            if (type == null || !type.includes("image")) {
                const textDoc = await vscode.workspace.openTextDocument(hoverFile);
                vscode.window.showTextDocument(textDoc);
            }
            else {
                open(hoverFile);
            }
        });
        context.subscriptions.push(clickInclude);
        // Shows clickable link to file after hovering over it
        // vscode.languages.registerHoverProvider(
        //     documentSelector,
        //     new class implements vscode.HoverProvider {
        //       provideHover(
        //         _document: vscode.TextDocument,
        //         _position: vscode.Position,
        //         _token: vscode.CancellationToken
        //       ): vscode.ProviderResult<vscode.Hover> {
        //         // Get range for a link
        //         const wordRegex = /\/\S+/;
        //         const wordRange = _document.getWordRangeAtPosition(_position, wordRegex);
        //         if (wordRange != undefined) {
        //             // Get text at that range
        //             const word = _document.getText(wordRange);
        //             // Request hover information using the snooty-parser server
        //             let request = async () => {
        //                 let contents: vscode.MarkdownString;
        //                 const file: string = await client.sendRequest("textDocument/resolve", {fileName: word, docPath: _document.uri.path, resolveType: "directive"});
        //                 const command = vscode.Uri.parse(`command:snooty.clickInclude`);
        //                 // Clean up absolute path for better UX. str.match() was not working with regex but can look into later
        //                 let workspaceFolder = vscode.workspace.name;
        //                 if (!workspaceFolder) {
        //                     return;
        //                 }
        //                 let folderIndex = file.search(workspaceFolder);
        //                 let hoverPathRelative = file.slice(folderIndex);
        //                 contents = new vscode.MarkdownString(`[${hoverPathRelative}](${command})`);
        //                 contents.isTrusted = true; // Enables commands to be used
        //                 return new vscode.Hover(contents, wordRange);
        //             }
        //             return request();
        //         }
        //       }
        //     } ()
        // );
        vscode.languages.registerDocumentLinkProvider(documentSelector, new docLinkProvider_1.DocumentLinkProvider(client));
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map