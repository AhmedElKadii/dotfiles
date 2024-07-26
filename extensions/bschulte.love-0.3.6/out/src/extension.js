'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const luaMode_1 = require("./luaMode");
const loveAutocomplete_1 = require("./loveAutocomplete");
const loveFuncitonSuggestions_1 = require("./loveFuncitonSuggestions");
exports.EXT_TAG = "LOVE-Autocomplete";
var openurl = require('openurl').open;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "love-autocomplete" is now active!');
    vscode.window.showInformationMessage("LOVE extension loaded!");
    // Setup our plugin to help with function signatures
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(luaMode_1.LUA_MODE, new loveFuncitonSuggestions_1.LoveSignatureHelpProvider(vscode.workspace.getConfiguration('lua')['docsTool']), '(', ','));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(luaMode_1.LUA_MODE, {
        provideCompletionItems(document, position, token) {
            let filename = document.fileName;
            let lineText = document.lineAt(position.line).text;
            let lineTillCurrentPosition = lineText.substr(0, position.character);
            let wordAtPosition = document.getWordRangeAtPosition(position);
            let currentWord = '';
            if (wordAtPosition && wordAtPosition.start.character < position.character) {
                let word = document.getText(wordAtPosition);
                currentWord = word.substr(0, position.character - wordAtPosition.start.character);
            }
            // Check if we don't have any '.'s in the line and the letter starts with 'l'
            // If so, return love as a suggestions
            var count = (lineText.match(/\./g) || []).length;
            if (count == 0 && currentWord == "l") {
                let suggestion = new vscode.CompletionItem("love", vscode.CompletionItemKind.Module);
                suggestion.detail = exports.EXT_TAG;
                suggestion.documentation = "LOVE 2D Game Framework";
                return [suggestion];
            }
            // Check through the list of functions that are included in this file and see if any match
            // the starting letter of the word we have so far
            let suggestions = loveAutocomplete_1.getSuggestions(lineText, currentWord);
            return suggestions;
        }
    }, '.'));
    // Setup the command to open the documentation for the LOVE method the cursor is currently on
    var disposable = vscode.commands.registerCommand('LOVE.openDocumentation', () => {
        // The code you place here will be executed every time your command is executed
        let editor = vscode.window.activeTextEditor;
        let functionCall = getFunctionCall(editor.selection.start.line, editor.selection.start.character);
        if (functionCall.startsWith("love.")) {
            console.log('Trying to open LOVE documentation!: ' + functionCall);
            // Check if we have a Type or Enum in the functionCall by looking at the first character
            // of each part of a split by '.' string and seeing if it's a capital letter
            for (let part of functionCall.split('.')) {
                if (part[0] === part[0].toUpperCase()) {
                    openurl("https://love2d.org/wiki/" + part);
                    return;
                }
            }
            openurl("https://love2d.org/wiki/" + functionCall);
        }
    });
    context.subscriptions.push(disposable);
    // Register command to launch love
    var launch = vscode.commands.registerCommand('LOVE.launch', () => {
        let terminal = vscode.window.createTerminal();
        terminal.sendText("love --console .", true);
    });
    context.subscriptions.push(launch);
}
exports.activate = activate;
// Get the full function call based on where the cursor is
function getFunctionCall(lineNum, cursorPosition) {
    let line = vscode.window.activeTextEditor.document.lineAt(lineNum);
    let lineText = line.text;
    let characterLimit = line.range.end.character;
    let functionCall = lineText.charAt(cursorPosition);
    let newPos = cursorPosition - 1;
    // Iterate from the cursor position to the beginning of the line or a whitespace character
    while (true) {
        if (newPos < 0) {
            // We've reached the beginning of the line so break
            break;
        }
        let newChar = lineText.charAt(newPos);
        let done = false;
        switch (newChar) {
            case ' ':
                done = true;
                break;
            case '\t':
                done = true;
                break;
            default:
                functionCall = newChar + functionCall;
                break;
        }
        newPos -= 1;
        if (done) {
            break;
        }
    }
    // Iterate from the cursor until the end of line or when a '(' is hit
    newPos = cursorPosition + 1;
    while (true) {
        if (newPos > characterLimit) {
            // We've reached the end of the line so break
            break;
        }
        let newChar = lineText.charAt(newPos);
        let done = false;
        switch (newChar) {
            case ' ':
                done = true;
                break;
            case '(':
                done = true;
                break;
            case '\t':
                done = true;
                break;
            default:
                functionCall = functionCall + newChar;
                break;
        }
        newPos += 1;
        if (done) {
            break;
        }
    }
    return functionCall;
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map