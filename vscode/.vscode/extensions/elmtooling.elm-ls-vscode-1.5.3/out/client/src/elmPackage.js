"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.activatePackage = void 0;
const vscode = __importStar(require("vscode"));
const utils = __importStar(require("./utils"));
const request = require("request");
let packageTerminal;
function transformToPackageQuickPickItems(packages) {
    return Object.keys(packages).map((item) => {
        return { label: item, description: item, info: packages[item] };
    });
}
function transformToPackageVersionQuickPickItems(selectedPackage) {
    return selectedPackage.info.map((version) => {
        return { label: version, description: undefined };
    });
}
function transformToQuickPickItems(packages) {
    return Object.keys(packages).map((item) => {
        return { label: item, description: "", info: packages[item] };
    });
}
function getJSON() {
    return new Promise((resolve, reject) => {
        request("https://package.elm-lang.org/all-packages", (err, _, body) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    resolve(JSON.parse(body));
                }
                catch (e) {
                    reject(e);
                }
            }
        });
    });
}
function getInstallPackageCommand(packageToInstall) {
    const config = vscode.workspace.getConfiguration("elmLS");
    let t = config.get("elmPath");
    t = t !== null && t !== void 0 ? t : "elm";
    return t + " install " + packageToInstall;
}
function installPackageInTerminal(packageToInstall) {
    try {
        const installPackageCommand = getInstallPackageCommand(packageToInstall);
        if (packageTerminal !== undefined) {
            packageTerminal.dispose();
        }
        packageTerminal = vscode.window.createTerminal("Elm Package Install");
        const [installPackageLaunchCommand, clearCommand,] = utils.getTerminalLaunchCommands(installPackageCommand);
        packageTerminal.sendText(clearCommand, true);
        packageTerminal.sendText(installPackageLaunchCommand, true);
        packageTerminal.show(false);
    }
    catch (error) {
        void vscode.window.showErrorMessage(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        "Cannot start Elm Package install. " + error);
    }
}
function browsePackage() {
    const quickPickPackageOptions = {
        matchOnDescription: true,
        placeHolder: "Choose a package",
    };
    const quickPickVersionOptions = {
        matchOnDescription: false,
        placeHolder: "Choose a version, or press <esc> to browse the latest",
    };
    return getJSON()
        .then(transformToPackageQuickPickItems)
        .then((packages) => vscode.window.showQuickPick(packages, quickPickPackageOptions))
        .then((selectedPackage) => {
        if (selectedPackage === undefined) {
            return; // no package
        }
        return vscode.window
            .showQuickPick(transformToPackageVersionQuickPickItems(selectedPackage), quickPickVersionOptions)
            .then((selectedVersion) => __awaiter(this, void 0, void 0, function* () {
            const uri = selectedVersion
                ? vscode.Uri.parse("https://package.elm-lang.org/packages/" +
                    selectedPackage.label +
                    "/" +
                    selectedVersion.label)
                : vscode.Uri.parse("https://package.elm-lang.org/packages/" +
                    selectedPackage.label +
                    "/latest");
            yield vscode.commands.executeCommand("vscode.open", uri);
        }))
            .then(() => undefined);
    });
}
function runInstall() {
    const quickPickOptions = {
        matchOnDescription: true,
        placeHolder: "Choose a package, or press <esc> to cancel",
    };
    return getJSON()
        .then(transformToQuickPickItems)
        .then((items) => vscode.window.showQuickPick(items, quickPickOptions))
        .then((value) => {
        if (value === undefined) {
            return; // no package
        }
        const packageName = value ? value.label : "";
        return installPackageInTerminal(packageName);
    });
}
function activatePackage() {
    return [
        vscode.commands.registerCommand("elm.install", runInstall),
        vscode.commands.registerCommand("elm.browsePackage", browsePackage),
    ];
}
exports.activatePackage = activatePackage;
//# sourceMappingURL=elmPackage.js.map