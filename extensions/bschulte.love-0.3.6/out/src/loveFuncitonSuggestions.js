'use strict';
const vscode_1 = require("vscode");
const luaApi_1 = require("./luaApi");
const loveAutocomplete_1 = require("./loveAutocomplete");
class LoveSignatureHelpProvider {
    constructor(toolForDocs) {
        this.toolForDocs = 'phpdoc';
        this.toolForDocs = toolForDocs;
    }
    provideSignatureHelp(document, position, token) {
        let theCall = this.walkBackwardsToBeginningOfCall(document, position);
        if (theCall == null) {
            return Promise.resolve(null);
        }
        // Find the name of the function that's being called
        let functionNameRange = this.previousTokenPosition(document, theCall.openParen);
        let functionName = document.getText(functionNameRange);
        // Find the full method call
        let currentLine = document.lineAt(position.line).text.substring(0, position.character);
        let fullMethodCall = currentLine.trim().split('(')[0];
        let result = new vscode_1.SignatureHelp();
        let declarationText, sig;
        let si;
        // If it's not a love call, just return
        if (fullMethodCall.split('.')[0] != 'love') {
            return Promise.resolve(result);
        }
        result.activeParameter = theCall.commas.length;
        // Check if it's a function of the base love module
        if (fullMethodCall.split('.').length == 2) {
            let functionData = this.getFunctionData(functionName, luaApi_1.api.functions);
            si = new vscode_1.SignatureInformation(functionName);
            si.documentation = functionData.description;
            let params = [];
            // params.push(new ParameterInformation("test label-param1", "test documentation-param1"));
            // params.push(new ParameterInformation("test label-param2", "test documentation-param2"));
            si.parameters = params;
            console.log("Result:", result);
            result.signatures.push(si);
            result.activeSignature = 0;
            result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
        }
        else {
            // This is either a function from a module or a type
            // Figure out which one we're dealing with first
            let moduleOrTypeName = fullMethodCall.split('.')[1];
            if (moduleOrTypeName[0] === moduleOrTypeName[0].toUpperCase()) {
                // We're dealing with a type of the base love module
                let typeData = loveAutocomplete_1.getTypeData(luaApi_1.api.types, moduleOrTypeName);
                let functionData = this.getFunctionData(functionName, typeData.functions);
                result = this.addFunctionSuggestions(functionData, result.activeParameter);
            }
            else {
                // We're dealing with a module of love
                // We can either be directly calling a function of the love module, or maybe we're calling a function
                // of the modules types. Check if the third element of the fullMethodCall (love.module.typeOrFunction)
                // to see if it's a type or function
                let functionOrTypeName = fullMethodCall.split('.')[2];
                let moduleData = loveAutocomplete_1.getModuleData(moduleOrTypeName);
                let functionData = {};
                if (functionOrTypeName[0] === functionOrTypeName[0].toUpperCase()) {
                    // We're dealing with a function from a type of the module
                    let typeData = loveAutocomplete_1.getTypeData(moduleData.types, functionOrTypeName);
                    functionData = this.getFunctionData(functionName, typeData.functions);
                }
                else {
                    // We're dealing with a function of the module directly
                    functionData = this.getFunctionData(functionName, moduleData.functions);
                }
                result = this.addFunctionSuggestions(functionData, result.activeParameter);
            }
        }
        result.activeSignature = 0;
        // Set the active param text to be bold and italics
        //this.highlightActiveParam(result, result.activeParameter);
        return Promise.resolve(result);
    }
    previousTokenPosition(document, position) {
        while (position.character > 0) {
            let word = document.getWordRangeAtPosition(position);
            if (word) {
                return word;
            }
            position = position.translate(0, -1);
        }
        return null;
    }
    highlightActiveParam(result, activeParam) {
        let label = result.signatures[result.activeSignature].label;
        let activeParamName = result.signatures[result.activeSignature].parameters[activeParam].label.split(':')[0];
        console.log("Replacing label: " + label, ", Param: " + activeParamName);
        result.signatures[result.activeSignature].label = label.replace(activeParamName, "**" + activeParamName + "**");
    }
    walkBackwardsToBeginningOfCall(document, position) {
        let currentLine = document.lineAt(position.line).text.substring(0, position.character);
        let parenBalance = 0;
        let commas = [];
        for (let char = position.character; char >= 0; char--) {
            switch (currentLine[char]) {
                case '(':
                    parenBalance--;
                    if (parenBalance < 0) {
                        return {
                            openParen: new vscode_1.Position(position.line, char),
                            commas: commas
                        };
                    }
                    break;
                case ')':
                    parenBalance++;
                    break;
                case ',':
                    if (parenBalance === 0) {
                        commas.push(new vscode_1.Position(position.line, char));
                    }
            }
        }
        return null;
    }
    // Find the data for a target function name given an array of functions
    getFunctionData(targetFunction, functions) {
        for (let i = 0; i < functions.length; i++) {
            if (targetFunction == functions[i].name) {
                return functions[i];
            }
        }
    }
    // Add the function suggestions based on the function data
    addFunctionSuggestions(functionData, activeParameter) {
        let suggestions = new vscode_1.SignatureHelp();
        // loop through all function variants
        for (let f of functionData.variants) {
            let si = new vscode_1.SignatureInformation(functionData.name);
            si.documentation = (f.description ? f.description : functionData.description);
            let argumentNames = [];
            // Loop through the arguments if there is any
            if ('arguments' in f) {
                for (let arg of f.arguments) {
                    argumentNames.push(arg.name + ": " + arg.type);
                    si.parameters.push(new vscode_1.ParameterInformation(arg.name, arg.name + ": " + arg.type + "\n" + arg.description));
                }
            }
            let decorator = vscode_1.window.createTextEditorDecorationType({ color: "white" });
            argumentNames[activeParameter] = argumentNames[activeParameter].toUpperCase();
            si.label = si.label + "(" + argumentNames.join(', ') + ")";
            suggestions.signatures.push(si);
        }
        return suggestions;
    }
}
exports.LoveSignatureHelpProvider = LoveSignatureHelpProvider;
//# sourceMappingURL=loveFuncitonSuggestions.js.map