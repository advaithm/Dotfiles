#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Path = __importStar(require("path"));
require("reflect-metadata");
const tsyringe_1 = require("tsyringe"); //must be after reflect-metadata
const vscode_languageserver_1 = require("vscode-languageserver");
const web_tree_sitter_1 = __importDefault(require("web-tree-sitter"));
const capabilityCalculator_1 = require("./capabilityCalculator");
const documentEvents_1 = require("./util/documentEvents");
const settings_1 = require("./util/settings");
const textDocumentEvents_1 = require("./util/textDocumentEvents");
// Show version for `-v` or `--version` arguments
if (process.argv[2] === "-v" || process.argv[2] === "--version") {
    // require is used to avoid loading package if not necessary (~30ms time difference)
    process.stdout.write(`${require("pjson").version}\n`);
    process.exit(0);
}
// default argument `--stdio`
if (process.argv.length === 2) {
    process.argv.push("--stdio");
}
// Composition root - be aware, there are some register calls that need to be done later
tsyringe_1.container.register("Connection", {
    useValue: vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all),
});
tsyringe_1.container.registerSingleton("Parser", web_tree_sitter_1.default);
tsyringe_1.container.registerSingleton("DocumentEvents", documentEvents_1.DocumentEvents);
tsyringe_1.container.register(textDocumentEvents_1.TextDocumentEvents, {
    useValue: new textDocumentEvents_1.TextDocumentEvents(),
});
const connection = tsyringe_1.container.resolve("Connection");
let server;
connection.onInitialize((params, cancel, progress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield web_tree_sitter_1.default.init();
    const absolute = Path.join(__dirname, "tree-sitter-elm.wasm");
    const pathToWasm = Path.relative(process.cwd(), absolute);
    connection.console.info(`Loading Elm tree-sitter syntax from ${pathToWasm}`);
    const language = yield web_tree_sitter_1.default.Language.load(pathToWasm);
    tsyringe_1.container.resolve("Parser").setLanguage(language);
    tsyringe_1.container.register(capabilityCalculator_1.CapabilityCalculator, {
        useValue: new capabilityCalculator_1.CapabilityCalculator(params.capabilities),
    });
    const initializationOptions = (_a = params.initializationOptions) !== null && _a !== void 0 ? _a : {};
    tsyringe_1.container.register("Settings", {
        useValue: new settings_1.Settings(initializationOptions, params.capabilities),
    });
    const { Server } = yield Promise.resolve().then(() => __importStar(require("./server")));
    server = new Server(params, progress);
    yield server.init();
    return server.capabilities;
}));
connection.onInitialized(() => {
    server.registerInitializedProviders();
});
// Listen on the connection
connection.listen();
// Don't die on unhandled Promise rejections
process.on("unhandledRejection", (reason, p) => {
    connection.console.error(`Unhandled Rejection at: Promise ${p} reason:, ${reason}`);
});
//# sourceMappingURL=index.js.map