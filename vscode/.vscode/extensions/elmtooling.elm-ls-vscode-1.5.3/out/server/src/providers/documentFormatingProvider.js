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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.DocumentFormattingProvider = void 0;
const tsyringe_1 = require("tsyringe");
const vscode_uri_1 = require("vscode-uri");
const Diff = __importStar(require("../util/diff"));
const elmUtils_1 = require("../util/elmUtils");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const textDocumentEvents_1 = require("../util/textDocumentEvents");
let DocumentFormattingProvider = class DocumentFormattingProvider {
    constructor() {
        this.formatText = (elmWorkspaceRootPath, elmFormatPath, text) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                cmdArguments: ["--stdin", "--elm-version", "0.19", "--yes"],
                notFoundText: "Install elm-format via 'npm install -g elm-format",
            };
            try {
                const format = yield elmUtils_1.execCmd(elmFormatPath, "elm-format", options, elmWorkspaceRootPath.fsPath, this.connection, text);
                return Diff.getTextRangeChanges(text, format.stdout);
            }
            catch (error) {
                this.connection.console.warn(JSON.stringify(error));
            }
        });
        this.handleFormattingRequest = (params, elmWorkspace) => __awaiter(this, void 0, void 0, function* () {
            this.connection.console.info(`Formatting was requested`);
            try {
                const text = this.events.get(params.textDocument.uri);
                if (!text) {
                    this.connection.console.error("Can't find file for formatting.");
                    return;
                }
                const settings = yield this.settings.getClientSettings();
                return yield this.formatText(elmWorkspace.getRootPath(), settings.elmFormatPath, text.getText());
            }
            catch (error) {
                error.message.includes("SYNTAX PROBLEM")
                    ? this.connection.console.error("Running elm-format failed. Check the file for syntax errors.")
                    : this.connection.window.showErrorMessage("Running elm-format failed. Install via " +
                        "'npm install -g elm-format' and make sure it's on your path");
            }
        });
        this.settings = tsyringe_1.container.resolve("Settings");
        this.connection = tsyringe_1.container.resolve("Connection");
        this.events = tsyringe_1.container.resolve(textDocumentEvents_1.TextDocumentEvents);
        this.connection.onDocumentFormatting(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((params) => vscode_uri_1.URI.parse(params.textDocument.uri)).handlerForWorkspace(this.handleFormattingRequest));
    }
};
DocumentFormattingProvider = __decorate([
    tsyringe_1.injectable()
], DocumentFormattingProvider);
exports.DocumentFormattingProvider = DocumentFormattingProvider;
//# sourceMappingURL=documentFormatingProvider.js.map