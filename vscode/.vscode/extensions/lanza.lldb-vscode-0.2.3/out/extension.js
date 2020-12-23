"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const MiddlewareDap_1 = require("./MiddlewareDap");
/*
 * Set the following compile time flag to true if the
 * debug adapter should run inside the extension host.
 * Please note: the test suite does not (yet) work in this mode.
 */
const EMBED_DEBUG_ADAPTER = true;
function activate(context) {
    const provider = new LLDBDebugConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("lldb-vscode", provider));
    if (EMBED_DEBUG_ADAPTER) {
        const factory = new LLDBDebugAdapterDescriptorFactory();
        context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory("lldb-vscode", factory));
        context.subscriptions.push(factory);
    }
    const command = "LLDBVSCode.freeLaunch";
    context.subscriptions.push(vscode.commands.registerCommand(command, freeLaunch));
}
exports.activate = activate;
function freeLaunch() {
    const dc = { type: "lldb-vscode", name: "Free Launch", request: "attach" };
    vscode.debug.startDebugging(undefined, dc);
}
function deactivate() {
    // nothing to do
}
exports.deactivate = deactivate;
class LLDBDebugConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    resolveDebugConfiguration(_1, config, _2) {
        if (!config.program) {
            if (config.name !== "Free Launch") {
                return vscode.window
                    .showInformationMessage("Cannot find a program to debug")
                    .then(_ => {
                    return undefined; // abort launch
                });
            }
        }
        return config;
    }
}
class LLDBDebugAdapterDescriptorFactory {
    constructor() {
        this.middlewareDap = undefined;
        this.logger = vscode.window.createOutputChannel("lldb-vscode");
    }
    createDebugAdapterDescriptor(_1, _2) {
        this.logger.show();
        this.dispose();
        this.middlewareDap = new MiddlewareDap_1.MiddlewareDap(this.logger);
        // make VS Code connect to debug server
        return new vscode.DebugAdapterServer(this.middlewareDap.getVSCodePort());
    }
    dispose() {
        if (this.middlewareDap) {
            this.middlewareDap.dispose();
            this.middlewareDap = undefined;
        }
    }
}
//# sourceMappingURL=extension.js.map