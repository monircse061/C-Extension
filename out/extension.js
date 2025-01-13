"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// plz 'npm install' initial of cloneproject
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const openai_1 = __importDefault(require("openai"));
const cSnippetGenerator_1 = require("./cSnippetGenerator");
// document : Open text document in VSCode
// position : Current cursor position
// token : Whether the operation was canceled
// context : Context in which code completion is provided
// sendMessage : Text length
// cursorindex : Cursor position
// textArea : Entire text
let CompletionProvider;
let candidatesData;
let cSnippetGenerator = null; // What's changed
let linePrefix;
let resulted_prefix;
let responseText = null;
let candidate_list = [];
// -- ChatGPT API Code --
const openai = new openai_1.default({
    organization: "",
    apiKey: "api-key",
});
// (Temporary) Fine Tuning Code
async function generativeAIcommunication(message) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: "gpt-3.5-turbo-0125",
    });
    const response = completion.choices[0].message.content;
    return response;
}
function activate(context) {
    console.log("Running the VSC Extension");
    cSnippetGenerator = new cSnippetGenerator_1.CSnippetGenerator("", "", "");
    // --- Candidate Code Completion Code ---
    // Command that displays a list of candidates using the candidates received after communicating with the server.
    const completionCommand = vscode.commands.registerCommand("extension.subhotkey", () => {
        // Delete existing Completion
        const disposable = vscode.Disposable.from(CompletionProvider);
        disposable.dispose();
        // Register a new Completion
        CompletionProvider = vscode.languages.registerCompletionItemProvider(["c"], {
            provideCompletionItems(document, position) {
                const completionItems = [];
                for (const { key, value, sortText } of candidatesData) {
                    // completion: means one candidate.
                    const completion = new vscode.CompletionItem(key.trim());
                    console.log("completion value:", completion);
                    // The value from the user's cursor position to the space
                    // ex) If 'IF a = 10', it becomes 10, if 'IF a = 10 ', it becomes ''.
                    linePrefix = document
                        .lineAt(position)
                        .text.slice(0, position.character);
                    // sortText to sort the phrase candidates by frequency
                    completion.sortText = sortText;
                    // Set the frequency for each phrase group to be output as Docs
                    const completionDocs = new vscode.MarkdownString("Frequency : " + value);
                    // Writing documentation for Completion
                    completion.documentation = completionDocs;
                    // Code suggestion Code to prevent filtering by prefix
                    completion.filterText = linePrefix;
                    completionItems.push(completion);
                }
                ``;
                return completionItems;
            },
            async resolveCompletionItem(item) {
                console.log("Execute the resolve function");
                // In the case of Graphics.Window, only Window should be the prefix.
                // The area after the '.' position is taken as the prefix.
                if (item && cSnippetGenerator !== null) {
                    const lastIndex = linePrefix.length - 1;
                    let insertText;
                    // linePrefix: If there is no code being hit
                    if (linePrefix[lastIndex] === " ") {
                        insertText = await cSnippetGenerator.getInsertText(item.label, "codecompletion");
                    }
                    else {
                        const lastDotIndex = linePrefix.lastIndexOf(".");
                        if (lastDotIndex !== -1) {
                            linePrefix = linePrefix.slice(lastDotIndex + 1).trim();
                        }
                        insertText =
                            linePrefix +
                                (await cSnippetGenerator.getInsertText(item.label, "codecompletion"));
                    }
                    if (insertText === null) {
                        insertText = "";
                    }
                    item.insertText = new vscode.SnippetString(insertText.trim());
                }
                return item;
            },
        });
        // Execute Triggest Suggest
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    });
    // Command that starts when you press the hot key
    // Gives a value to the server.
    const hotKeyProvider = vscode.commands.registerCommand("extension.hotkey", () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            // Get the document of the currently open editor
            const document = activeEditor.document;
            // Get cursor position
            const cursorPosition = activeEditor.selection.active;
            const cursorOffset = document.offsetAt(cursorPosition);
            const frontCursorTextLength = `${document
                .getText()
                .length.toString()} True`;
            const frontCursorText = document.getText().substring(0, cursorOffset);
            const backCursorText = document
                .getText()
                .substring(cursorOffset, document.getText().length);
            // Create an CSnippet Generator object with information to communicate with the server.
            const cSnippetGenerator = new cSnippetGenerator_1.CSnippetGenerator(frontCursorTextLength, frontCursorText, backCursorText);
            // Method to get CompletionItems
            cSnippetGenerator.getCompletionItems();
            // Methods that occur when you get CompletionItems
            cSnippetGenerator.onDataReceived((data) => {
                // c
                candidatesData = data;
                console.log("completionData : ", candidatesData);
                vscode.commands.executeCommand("extension.subhotkey");
            });
        }
        else {
            console.log("There are currently no open editors.");
        }
    });
    // Command to test if TriggerSuggest is working properly
    let codeTrigger = vscode.commands.registerCommand("extension.Triggertest", () => {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    });
    // --- ChatGPT Code Completion Code ---
    let currentDocument = undefined;
    let disposable = vscode.commands.registerCommand("extension.completeCode", async () => {
        const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath; // Get the first workspace folder path
        const untitledUri = vscode.Uri.parse("untitled:" + path.join("SuggestedCode.c")); // Generate a URI for an untitled document that will display the code
        const document = await vscode.workspace.openTextDocument(untitledUri); // Open or create a document from a URI
        const userEditor = vscode.window.activeTextEditor; // Get the active text editor that the user is 'currently working in'
        // Open a new text document (document, a temporary SuggestedCode.c file) next to the active text editor the user is 'working on'
        const newEditor = await vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.Beside,
            preview: false,
        });
        // If the current workspace is not open, an error message is displayed.
        if (!folderPath) {
            vscode.window.showErrorMessage("Workspace is not open");
            return;
        }
        // If the user has an active text editor that they are 'working on', get the code and pass it to the ChatGPT API.
        if (userEditor) {
            const document = userEditor.document;
            const entireText = document.getText(); // Get the entire contents (code) of the document.
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
            }, async (progress) => {
                progress.report({
                    message: "ChatGPT C Completion is generating code...",
                });
                const response = await generativeAIcommunication(entireText);
                progress.report({ message: "Updating editor now..." });
                // Code written on the side webview screen + response display
                await newEditor.edit(editBuilder => {
                    // Delete all existing contents of the webview (initialize)
                    const lastLine = newEditor.document.lineAt(newEditor.document.lineCount - 1);
                    const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                    editBuilder.delete(range);
                    // Output newly received content to the webview
                    editBuilder.insert(new vscode.Position(0, 0), "[Code entered]\n" +
                        entireText +
                        "\n\n" +
                        "==\n\n" +
                        "[Proposed Code]\n" +
                        response);
                });
                // Update results directly in the user screen editor
                await userEditor.edit(editBuilder => {
                    // Delete all contents of the active editor
                    const lastLine = document.lineAt(document.lineCount - 1);
                    const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                    editBuilder.delete(range);
                    // Prints newly received content to the active editor
                    editBuilder.insert(new vscode.Position(0, 0), "" + response);
                });
                progress.report({
                    message: "ChatGPT C Completion has completed generating code!",
                });
                await new Promise(resolve => setTimeout(resolve, 2000)); // Output completion message for 2 seconds
                return;
            });
        }
    });
    // --- Prompt Code ---
    const promptCommand = vscode.commands.registerCommand("extension.subpromptkey", () => {
        // Delete existing Completion
        const disposable = vscode.Disposable.from(CompletionProvider);
        disposable.dispose();
        // Register a new Completion
        CompletionProvider = vscode.languages.registerCompletionItemProvider(["c"], {
            async provideCompletionItems(document, position) {
                const completionItems = [];
                let scroll = 0;
                const maxScroll = 3;
                for (const { key, value, sortText } of candidatesData) {
                    if (scroll >= maxScroll) {
                        break;
                    }
                    // completion: means one candidate.
                    const completion = new vscode.CompletionItem(key.trim());
                    candidate_list.push(key.trim());
                    console.log("Completion value ", scroll + 1, ":", completion);
                    resulted_prefix = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
                    console.log("Resulted Prefix:", resulted_prefix);
                    // The value from the user's cursor position to the space. 
                    // ex) If 'IF a = 10', it becomes 10. If 'IF a = 10 ', it becomes ''.
                    const normalizedresulted_prefix = resulted_prefix.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\s*=\s*/g, "=").replace(/\s*>\s*/g, ">").replace(/\s*<\s*/g, "<").trim();
                    console.log("Normalized Resulted Prefix:", normalizedresulted_prefix);
                    linePrefix = document
                        .lineAt(position)
                        .text.slice(0, position.character);
                    console.log("Line Prefix:", linePrefix);
                    const normalizedlinePrefix = linePrefix.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\s*=\s*/g, "=").replace(/\s*>\s*/g, ">").replace(/\s*<\s*/g, "<").trim();
                    console.log("Normalized Line Prefix:", normalizedlinePrefix);
                    let responseText = await cSnippetGenerator?.getInsertText(completion.label, resulted_prefix);
                    if (responseText) {
                        console.log("Original Response Text:", responseText);
                        // Normalize the responseText in the same way (remove spaces inside the parentheses and spaces)
                        const normalizedResponseText = responseText.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\s*=\s*/g, "=").replace(/\s*>\s*/g, ">").replace(/\s*<\s*/g, "<").trim();
                        console.log("Normalized Original Response Text:", normalizedResponseText);
                        // "TextWindow" case and is present in the responseText
                        if (normalizedresulted_prefix === "TextWindow" || normalizedresulted_prefix === "TextWindow.") {
                            responseText = normalizedResponseText.replace(normalizedresulted_prefix, '');
                            console.log("Updated Response Text in TextWindow case:", responseText);
                        }
                        // if Completion Label exists in the responseText
                        if (typeof completion.label === "string" && responseText) {
                            const normalizedLabel = completion.label.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\s*=\s*/g, "=").replace(/\s*>\s*/g, ">").replace(/\s*<\s*/g, "<").trim();
                            responseText = normalizedResponseText.replace(normalizedLabel, "").trimStart();
                            console.log("Updated Response After Candi Remove:", responseText);
                        }
                        // Remove the full prefix from the response text 
                        if (normalizedResponseText.includes(normalizedresulted_prefix)) {
                            responseText = normalizedResponseText.replace(normalizedresulted_prefix, '');
                            console.log("Response Text After Removing Full Matching Prefix:", responseText);
                        }
                        // Remove the line prefix from the response text 
                        else if (normalizedResponseText.includes(normalizedlinePrefix)) {
                            responseText = normalizedResponseText.replace(normalizedlinePrefix, '');
                            console.log("Response After Removing Line Matching Prefix:", responseText);
                        }
                        responseText = responseText.replace(/=/g, " = ").replace(/</g, " < ").replace(/>/g, " > ").trim();
                        // Find the index of the first occurrence of ';' in responseText
                        const semicolonIndex = responseText.indexOf(';');
                        // If a semicolon is found, truncate the responseText up to that index
                        if (semicolonIndex !== -1) {
                            responseText = responseText.slice(0, semicolonIndex + 1); // Include the semicolon
                        }
                        let trimmedKey = key.trim();
                        // if (trimmedKey.length > 18) {
                        //     trimmedKey = trimmedKey.substring(0, 10) + "..";
                        // }
                        let completionFinalText = new vscode.CompletionItem(responseText);
                        // sortText to sort the phrase candidates by frequency
                        completionFinalText.sortText = sortText;
                        // Set the frequency for each phrase group to be output as Docs
                        const completionDocs = new vscode.MarkdownString(trimmedKey);
                        // Writing documentation for Completion
                        completionFinalText.documentation = completionDocs;
                        // Code suggestion Code to prevent filtering by prefix
                        completionFinalText.filterText = linePrefix;
                        completionItems.push(completionFinalText);
                        console.log('Completed Suggestion: ', completionFinalText);
                    }
                    scroll++;
                }
                ``;
                return completionItems;
            },
            async resolveCompletionItem(item) {
                // The content of the code written by the user so far should be included: resulted_prefix
                // This function is called when selected: selected item
                // The values ​​to be given to prompt: language, resulted_prefix, item
                console.log("Candidate List:");
                candidate_list.forEach(candidate => console.log(candidate));
                //console.log("Execute the resolve function for Prompt Code................");
                // In the case of Graphics.Window, only Window should be the prefix.
                // The area after the '.' position is taken as a prefix.
                const lastDotIndex = linePrefix.lastIndexOf(".");
                if (lastDotIndex !== -1) {
                    linePrefix = linePrefix.slice(lastDotIndex + 1).trim();
                }
                if (linePrefix.includes('(')) {
                    linePrefix = "";
                    console.log("Modified linePrefix after bracket:", linePrefix);
                }
                if (linePrefix.includes('=')) {
                    // Get the text after the '=' symbol
                    linePrefix = linePrefix.split('=')[1].trim();
                    console.log("Modified linePrefix after '=' symbol:", linePrefix);
                }
                if (item && cSnippetGenerator !== null) {
                    //console.log("item: ",item.label);
                    // Remove Completion item from response text
                    let extractedText = '';
                    if (typeof item.label === 'string') {
                        extractedText = item.label;
                    }
                    // let extractedText = '';
                    // if (typeof item.label === 'string') {
                    //   // Split and extract text based on '|'
                    //   const labelParts = item.label.split('|').map(part => part.trim());
                    //   if (labelParts.length > 1) {
                    //       extractedText = labelParts[1]; // Text after '|'
                    //       // Ensure the left part of the label is not included
                    //       const leftPart = labelParts[0].replace(/\s+/g, ''); // Normalize by removing spaces
                    //       const normalizedExtracted = extractedText.replace(/\s+/g, ''); // Normalize the extracted text
                    //       if (normalizedExtracted.includes(leftPart)) {
                    //           extractedText = extractedText
                    //               .replace(new RegExp(leftPart.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), '')
                    //               .trim();
                    //       }
                    //   }
                    // } else if (typeof item.label === 'object') {
                    //   console.error("CompletionItemLabel structure detected; please adjust extraction logic.");
                    // }
                    // console.log("Extracted Text: ", extractedText);
                    const lastIndex = linePrefix.length - 1;
                    let insertText;
                    // console.log("linePrefix[lastIndex] = ", linePrefix[lastIndex]);
                    // console.log("linePrefix : ", linePrefix);
                    if (linePrefix[lastIndex] === " ") {
                        insertText = extractedText;
                    }
                    else {
                        insertText = linePrefix + extractedText;
                    }
                    if (insertText === null) {
                        insertText = ""; //If insertText is null, set it to an empty string.
                    }
                    item.insertText = new vscode.SnippetString(insertText);
                }
                return item;
            },
        });
        // Triggest Suggest Execution
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    });
    // Command that starts when you press the hot key
    // Gives a value to the server.
    const PromptKeyProvider = vscode.commands.registerCommand("extension.promptkey", () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            // Get the document of the currently open editor
            const document = activeEditor.document;
            // Get cursor position
            const cursorPosition = activeEditor.selection.active;
            const cursorOffset = document.offsetAt(cursorPosition);
            const frontCursorTextLength = `${document
                .getText()
                .length.toString()} True`;
            const frontCursorText = document.getText().substring(0, cursorOffset);
            const backCursorText = document
                .getText()
                .substring(cursorOffset, document.getText().length);
            // Create an CSnippet Generator object with information to communicate with the server.
            const cSnippetGenerator = new cSnippetGenerator_1.CSnippetGenerator(frontCursorTextLength, frontCursorText, backCursorText);
            // Method to get CompletionItems
            cSnippetGenerator.getCompletionItems();
            // Methods that occur when you get CompletionItems
            cSnippetGenerator.onDataReceived((data) => {
                // c
                candidatesData = data;
                console.log("completionData : ", candidatesData);
                vscode.commands.executeCommand("extension.subpromptkey");
            });
        }
        else {
            console.log("There are currently no open editors.");
        }
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(hotKeyProvider, completionCommand, codeTrigger, promptCommand, PromptKeyProvider);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map