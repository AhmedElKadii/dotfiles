"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.resThumb = exports.projectDir = exports.byteUnits = exports.base64 = exports.jsHash = void 0;
const vscode_1 = require("vscode");
const nodejs = typeof process != 'undefined' ? process : undefined;
const createHash = nodejs && require('crypto').createHash;
const homedir = nodejs && require('os').homedir();
const dns = nodejs && require('dns/promises');
const toUTF8 = new TextDecoder(), fromUTF8 = new TextEncoder();
function md5(s) {
    return createHash?.('md5').update(s).digest('hex');
}
async function sha512(s) {
    if (createHash)
        return createHash('sha512').update(s).digest('hex');
    return Array.prototype.map.call(new Uint8Array(await crypto.subtle.digest('SHA-512', fromUTF8.encode(s))), (b) => b.toString(16).padStart(2, '0')).join('');
}
function jsHash(s, seed = 0) {
    let a = 0xDEADBEEF ^ seed, b = 0x41C6CE57 ^ seed;
    for (let i = 0, c; i < s.length; i++) {
        c = s.charCodeAt(i);
        a = Math.imul(a ^ c, 2654435761);
        b = Math.imul(b ^ c, 1597334677);
    }
    a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
    b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
    return 0x100000000 * (0x1FFFFF & b) + (a >>> 0);
}
exports.jsHash = jsHash;
function base64(data) {
    if (nodejs)
        return Buffer.from(data).toString('base64');
    const url = new FileReaderSync().readAsDataURL(new Blob([data]));
    return url.substring(url.indexOf(',', 12) + 1);
}
exports.base64 = base64;
function encodeDataURIText(data) {
    return encodeURI(data).replace(/#|%20/g, s => s == '#' ? '%23' : ' ');
}
function byteUnits(numBytes) {
    if (numBytes == 1)
        return '1 byte';
    if (numBytes < 1024)
        return numBytes + ' bytes';
    const k = numBytes / 1024;
    if (k < 1024)
        return k.toFixed(1) + ' KiB';
    const m = k / 1024;
    if (m < 1024)
        return m.toFixed(1) + ' MiB';
    const g = m / 1024;
    if (g < 1024)
        return g.toFixed(1) + ' GiB';
    const t = g / 1024;
    return t.toFixed(1) + ' TiB';
}
exports.byteUnits = byteUnits;
async function isOnline() {
    if (typeof navigator != 'undefined')
        return navigator.onLine;
    try {
        return dns ? !!(await dns.lookup(onlineDocsHost)).address : false;
    }
    catch (err) {
        return false;
    }
}
function _snakeCase(pascalCase) {
    return pascalCase.replace(/(?<!^)\d*[A-Z_]/g, s => '_' + s).toLowerCase();
}
async function _fetchAsDataUri(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return vscode_1.Uri.from({ scheme: 'data', path: blob.type + ';base64,' + base64(bytes) });
        }
        else
            console.warn(`Could not fetch as data URI: ${response.status} (${response.statusText}) ${url}`);
    }
    catch (e) {
        console.error(e);
    }
    return null;
}
class GDResource {
    path;
    type;
    symbol;
}
class GDAsset {
    static floatValue(code) {
        switch (code) {
            case 'nan': return NaN;
            case 'inf': return Infinity;
            case 'inf_neg': return -Infinity;
        }
        const n = +code;
        return isNaN(n) ? null : n;
    }
    static float16Code(value) {
        if (isNaN(value))
            return 'nan';
        if (value == Infinity)
            return 'inf';
        if (value == -Infinity)
            return 'inf_neg';
        return String(+value.toPrecision(6));
    }
    static filename(resPath) {
        const match = /^(?:.*[/\\])?([^/\\]*?)(\.[^./\\<>]*)?(::.*)?$/.exec(resPath);
        if (!match)
            return null;
        return { title: match[1], ext: match[2], subPath: match[3] };
    }
    static nodeCode(path, percent = false) {
        return (percent ? '%' : '$') + (/^\/?(?:[A-Za-z_]\w*\/)*[A-Za-z_]\w*$/.test(path) ? path : `"${path}"`);
    }
    rootNode = undefined;
    nodePath(n) {
        if (!this.rootNode || !n)
            return n;
        if (n == '.')
            return GDAsset.nodeCode('/root/' + this.rootNode);
        if (n.startsWith('./'))
            return GDAsset.nodeCode(n.substring(2));
        return GDAsset.nodeCode(n);
    }
    resCall(code) {
        const match = code.match(/^((?:Ext|Sub)Resource)\s*\(\s*(?:(\d+)|"([^"\\]*)")\s*\)$/);
        if (!match)
            return null;
        const keyword = match[1];
        const id = match[2] ?? GDAssetProvider.unescapeString(match[3]);
        const resource = this.refs[keyword][id];
        return { keyword, id, resource };
    }
    resource = undefined;
    refs = {
        ExtResource: {},
        SubResource: {},
    };
    strings = [];
    comments = [];
    isInString(place) {
        for (const token of this.strings)
            if (token.range.contains(place))
                return true;
        return false;
    }
    isInComment(place) {
        for (const token of this.comments)
            if (token.range.contains(place))
                return true;
        return false;
    }
    isNonCode(place) { return this.isInString(place) || this.isInComment(place); }
}
function sectionSymbol(document, match, range, gdasset) {
    const [, , tag, rest] = match;
    const attributes = {};
    let id;
    for (const assignment of rest.matchAll(/\b([\w-]+)\b\s*=\s*(?:(\d+)|"([^"\\]*)"|((?:Ext|Sub)Resource\s*\(.*?\)))/g)) {
        const value = assignment[2] ?? assignment[4] ?? GDAssetProvider.unescapeString(assignment[3]);
        attributes[assignment[1]] = value;
        if (assignment[1] == 'id')
            id = value;
    }
    const symbol = new vscode_1.DocumentSymbol(tag, rest, vscode_1.SymbolKind.Namespace, range, range);
    switch (tag) {
        case 'gd_scene': {
            const docUriPath = document.uri.path;
            const [, fileTitle, ext] = /^\/(?:.*\/)*(.*?)(\.\w*)?$/.exec(docUriPath) ?? [undefined, docUriPath];
            symbol.name = fileTitle;
            symbol.detail = 'PackedScene';
            symbol.kind = vscode_1.SymbolKind.File;
            gdasset.resource = { path: `${fileTitle}${ext ?? ''}`, type: 'PackedScene', symbol };
            break;
        }
        case 'gd_resource': {
            const fileName = document.uri.path.replace(/^\/(.*\/)*/, '');
            symbol.name = fileName;
            const type = attributes.type ?? '';
            symbol.detail = type;
            symbol.kind = vscode_1.SymbolKind.File;
            gdasset.resource = { path: fileName, type, symbol };
            break;
        }
        case 'ext_resource': {
            const type = attributes.type ?? '';
            if (id)
                gdasset.refs.ExtResource[id] = { path: attributes.path ?? '?', type, symbol };
            symbol.name = attributes.path ?? tag;
            symbol.detail = type;
            symbol.kind = vscode_1.SymbolKind.Variable;
            break;
        }
        case 'sub_resource': {
            const type = attributes.type ?? '';
            if (id) {
                const subPath = '::' + id;
                gdasset.refs.SubResource[id] = { path: `${gdasset.resource?.path ?? ''}${subPath}`, type, symbol };
                symbol.name = subPath;
            }
            symbol.detail = type;
            symbol.kind = vscode_1.SymbolKind.Object;
            break;
        }
        case 'node':
            if (attributes.parent == undefined)
                symbol.name = attributes.name ? GDAsset.nodeCode(`/root/${gdasset.rootNode = attributes.name}`) : tag;
            else
                symbol.name = gdasset.nodePath(`${attributes.parent}/${attributes.name}`);
            if (attributes.type)
                symbol.detail = attributes.type;
            else if (attributes.index)
                symbol.detail = '@' + attributes.index;
            else if (attributes.instance_placeholder) {
                const path = attributes.instance_placeholder;
                symbol.detail = `InstancePlaceholder # ${GDAsset.filename(path)?.title ?? path}`;
            }
            else if (attributes.instance) {
                const path = gdasset.resCall(attributes.instance)?.resource?.path ?? '?';
                symbol.detail = `# ${GDAsset.filename(path)?.title ?? path}`;
            }
            else
                symbol.detail = '';
            symbol.kind = vscode_1.SymbolKind.Object;
            break;
        case 'connection':
            if (attributes.signal && attributes.from && attributes.to && attributes.method) {
                symbol.name = `${gdasset.nodePath(attributes.from)}.${attributes.signal}` +
                    `.connect(${gdasset.nodePath(attributes.to)}.${attributes.method})`;
                symbol.detail = '';
            }
            symbol.kind = vscode_1.SymbolKind.Event;
            break;
        case 'editable':
            symbol.name = `is_editable_instance(${gdasset.nodePath(attributes.path ?? '')})`;
            symbol.detail = '';
            symbol.kind = vscode_1.SymbolKind.Boolean;
            break;
    }
    return symbol;
}
class GDAssetProvider {
    static godotDocs = [
        { language: 'godot-project' },
        { language: 'godot-resource' },
        { language: 'godot-scene' },
        { language: 'godot-asset' },
    ];
    static docs = GDAssetProvider.godotDocs.concat({ language: 'config-definition' });
    static unescapeString(partInsideQuotes) {
        let s = '';
        for (const m of partInsideQuotes.matchAll(/\\(["bfnrt\\]|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{6})|\\$|\\?([^])/gmu)) {
            switch (m[1]) {
                case '\\':
                case '"':
                    s += m[1];
                    continue;
                case 'n':
                    s += '\n';
                    continue;
                case 't':
                    s += '\t';
                    continue;
                case 'r':
                    s += '\r';
                    continue;
                case 'b':
                    s += '\b';
                    continue;
                case 'f':
                    s += '\f';
                    continue;
                case undefined:
                case null:
                case '':
                    s += m[2] ?? '';
                    continue;
                default:
                    s += String.fromCharCode(parseInt(m[1].substring(1), 16));
                    continue;
            }
        }
        return s;
    }
    defs = {};
    async parsedGDAsset(document, _token) {
        if (document.languageId == 'config-definition')
            return undefined;
        let gdasset = this.defs[document.uri.toString(true)];
        if (!gdasset) {
            await this.provideDocumentSymbols(document, _token);
            gdasset = this.defs[document.uri.toString(true)];
        }
        return gdasset;
    }
    async provideDocumentSymbols(document, _token) {
        const gdasset = document.languageId == 'config-definition' ? null :
            this.defs[document.uri.toString(true)] = new GDAsset();
        let previousEnd;
        let currentSection;
        let currentProperty = null;
        const symbols = [];
        const n = document.lineCount;
        for (let i = 0, j = 0; i < n;) {
            const range = document.validateRange(new vscode_1.Range(i, j, i, Infinity));
            const text = document.getText(range);
            let match;
            if (j == 0 && (match = text.match(/^\s*(\[\s*([\p{L}\w-]+(?:\s+[\p{L}\w-]+|\s+"[^"\\]*")*(?=\s*\])|[^[\]\s]+)\s*([^;#]*?)\s*([\]{[(=]))\s*([;#].*)?$/u))) {
                if (currentSection && previousEnd)
                    currentSection.range = new vscode_1.Range(currentSection.range.start, previousEnd);
                if (gdasset)
                    currentSection = sectionSymbol(document, match, range, gdasset);
                else {
                    const [, , tag, rest] = match;
                    const kind = rest ? vscode_1.SymbolKind.Object : vscode_1.SymbolKind.Namespace;
                    currentSection = new vscode_1.DocumentSymbol(tag, rest, kind, range, range);
                }
                symbols.push(currentSection);
                currentProperty = null;
                previousEnd = range.end;
                i++;
                continue;
            }
            else if (j == 0 && (match = text.match(/^\s*(((?:[\p{L}\w-]+[./])*[\p{L}\w-]+)(?:\s*\[([\w\\/.:!@$%+-]+)\])?)\s*=/u))) {
                const [, prop, key, index] = match;
                let s = currentSection?.children ?? symbols;
                if (index) {
                    const p = `${key}[]`;
                    let parentProp = s.find(value => value.name == p);
                    if (!parentProp)
                        s.push(parentProp = new vscode_1.DocumentSymbol(p, '', vscode_1.SymbolKind.Array, range, range));
                    parentProp.range = new vscode_1.Range(parentProp.range.start, range.end);
                    s = parentProp.children;
                }
                if (currentSection)
                    currentSection.range = new vscode_1.Range(currentSection.range.start, range.end);
                currentProperty = new vscode_1.DocumentSymbol(prop, '', vscode_1.SymbolKind.Property, range, range);
                s.push(currentProperty);
                j = match[0].length;
                previousEnd = new vscode_1.Position(i, j);
                continue;
            }
            else if ((match = text.match(/^(\s*)([;#].*)?$/))) {
                if (gdasset && match[2]) {
                    j += match[1].length;
                    gdasset.comments.push({ range: new vscode_1.Range(i, j, i, range.end.character), value: match[2] });
                }
                previousEnd = range.end;
                j = 0;
                i++;
                continue;
            }
            if (text.startsWith('"')) {
                let str = "";
                let s = text.substring(1);
                j++;
                lines: while (true) {
                    for (const [sub] of s.matchAll(/"|(?:\\(?:["bfnrt\\]|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{6}|$)|\\?[^"\r\n])+/gmu)) {
                        j += sub.length;
                        if (sub == '"')
                            break lines;
                        str += GDAssetProvider.unescapeString(sub);
                    }
                    str += "\n";
                    j = 0;
                    i++;
                    if (i >= n)
                        break;
                    s = document.lineAt(i).text;
                }
                if (i >= n)
                    break;
                if (gdasset)
                    gdasset.strings.push({ range: new vscode_1.Range(range.start.line, range.start.character, i, j), value: str });
            }
            else if ((match = text.match(/^\s+/))) {
                j += match[0].length;
            }
            else if ((match = text.match(/^[^"\s]+/))) {
                j += match[0].length;
            }
            else
                throw Error();
            if (currentProperty) {
                const start = currentProperty.range.start;
                const endChar = i > range.end.line ? j : range.end.character;
                currentProperty.range = new vscode_1.Range(start.line, start.character, i, endChar);
            }
            previousEnd = new vscode_1.Position(i, j);
        }
        if (currentSection && previousEnd)
            currentSection.range = new vscode_1.Range(currentSection.range.start, previousEnd);
        return symbols;
    }
    async provideDefinition(document, position, token) {
        const gdasset = this.defs[document.uri.toString(true)];
        if (!gdasset || gdasset.isInComment(position))
            return null;
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange)
            return null;
        const word = document.getText(wordRange);
        let match;
        if (isPathWord(word, wordRange, document)) {
            const resLoc = await locateResPath(word, document);
            if (typeof resLoc != 'string')
                return new vscode_1.Location(resLoc.uri, new vscode_1.Position(0, 0));
            return null;
        }
        if (gdasset.isInString(wordRange))
            return null;
        if ((match = word.match(/^((?:Ext|Sub)Resource)\s*\(\s*(?:(\d+)|"([^"\\]*)")\s*\)$/))) {
            const keyword = match[1];
            const id = match[2] ?? GDAssetProvider.unescapeString(match[3]);
            const s = gdasset.refs[keyword][id]?.symbol;
            if (!s)
                return null;
            if (keyword == 'ExtResource') {
                let d = document.getText(s.selectionRange).indexOf(' path="');
                d = d < 0 ? 0 : d + 7;
                return new vscode_1.Location(document.uri, s.range.start.translate(0, d));
            }
            return new vscode_1.Location(document.uri, s.range);
        }
        const outWord = document.getText(new vscode_1.Range(wordRange.start.line, 0, wordRange.end.line, wordRange.end.character + 1));
        if (outWord.match(/\btype=".*"$|[([\]]$/) && (match = word.match(/^(?:@?[A-Z][A-Za-z0-9]+|float|int|bool)$/)))
            return await apiDocs(document, match[0], '', token);
        const line = document.lineAt(wordRange.start);
        if ((match = line.text.match(/^\s*(\w+)\s*=/)) && match[1] == word) {
            const regexSectionClass = /^\s*\[\s*\w+(?:\s+\w+\s*=\s*(?:\d+|"[^"\\]*"))*?\s+type\s*=\s*"([^"\\]+)".*?\s*\]\s*(?:[;#].*)?$/;
            const regexSectionNoClass = /^\s*\[\s*(\w+)(?:\s+\w+\s*=\s*(?:\d+|"[^"\\]*"))*?.*?\s*\]\s*(?:[;#].*)?$/;
            for (let i = line.lineNumber - 1; i >= 0; i--) {
                const textLine = document.lineAt(i).text;
                if ((match = textLine.match(regexSectionClass)))
                    return await apiDocs(document, match[1], word, token);
                if (!(match = textLine.match(regexSectionNoClass)))
                    continue;
                let className;
                const sectionTag = match[1];
                if (sectionTag == 'resource' && gdasset.resource?.type)
                    className = gdasset.resource.type;
                else if (sectionTag == 'node')
                    className = 'Node';
                else if (sectionTag == 'sub_resource')
                    className = 'Resource';
                else
                    return null;
                return await apiDocs(document, className, word, token);
            }
            return null;
        }
        return null;
    }
    async provideHover(document, position, token) {
        const gdasset = this.defs[document.uri.toString(true)];
        if (!gdasset || gdasset.isInComment(position))
            return null;
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange)
            return null;
        const word = document.getText(wordRange);
        const wordIsPath = isPathWord(word, wordRange, document);
        if (!wordIsPath && gdasset.isInString(wordRange))
            return null;
        const hover = [];
        let resPath, resRef;
        if (word == 'ext_resource' || wordIsPath) {
            let res;
            if (word == 'ext_resource') {
                const line = document.lineAt(position).text;
                const match = /^\[\s*ext_resource\s+.*?\bid\s*=\s*(?:(\d+)\b|"([^"\\]*)")/.exec(line);
                if (!match)
                    return null;
                res = gdasset.refs.ExtResource[match[1] ?? GDAssetProvider.unescapeString(match[2])];
                resPath = res?.path ?? '';
                if (!resPath)
                    return null;
            }
            else {
                resPath = word;
                const extResSymbols = gdasset.refs.ExtResource;
                for (const id in extResSymbols) {
                    if (extResSymbols[id]?.path == resPath) {
                        res = extResSymbols[id];
                        break;
                    }
                }
            }
            let id = null;
            const match = /^(.*?)::([^\\/:]*)$/.exec(resPath);
            if (match) {
                [resPath, id] = [match[1], match[2]];
                if (!res && resPath == await resPathOfDocument(document)) {
                    res = gdasset.refs.SubResource[id];
                    return new vscode_1.Hover(gdCodeLoad(resPath, id, res?.type, document.languageId), wordRange);
                }
            }
            else if (!res && resPath == await resPathOfDocument(document))
                res = gdasset.resource;
            hover.push(gdCodeLoad(resPath, id, res?.type, document.languageId));
        }
        else if (word == 'sub_resource') {
            const line = document.lineAt(position).text;
            const match = /^\[\s*sub_resource\s+type\s*=\s*"([^"\\]*)"\s*id\s*=\s*(?:(\d+)\b|"([^"\\]*)")/.exec(line);
            if (!match)
                return null;
            const [, type, idN, idS] = match, id = idN ?? GDAssetProvider.unescapeString(idS);
            resPath = await resPathOfDocument(document);
            return new vscode_1.Hover(gdCodeLoad(resPath, id, type, document.languageId), wordRange);
        }
        else if (word == 'gd_resource') {
            const line = document.lineAt(position).text;
            const match = /^\[\s*gd_resource\s+type\s*=\s*"([^"\\]*)"/.exec(line);
            if (!match)
                return null;
            resPath = await resPathOfDocument(document);
            hover.push(gdCodeLoad(resPath, null, match[1], document.languageId));
        }
        else if (word == 'gd_scene') {
            const line = document.lineAt(position).text;
            const match = /^\[\s*gd_scene\b/.exec(line);
            if (!match)
                return null;
            resPath = await resPathOfDocument(document);
            hover.push(gdCodeLoad(resPath, null, 'PackedScene', document.languageId));
        }
        else if ((resRef = gdasset.resCall(word))) {
            const res = resRef.resource;
            if (!res)
                return null;
            if (resRef.keyword == 'SubResource') {
                resPath = await resPathOfDocument(document);
                return new vscode_1.Hover(gdCodeLoad(resPath, resRef.id, res.type, document.languageId), wordRange);
            }
            resPath = res.path;
            hover.push(gdCodeLoad(resPath, null, res.type, document.languageId));
        }
        else
            return null;
        if (token.isCancellationRequested)
            return null;
        if (vscode_1.workspace.getConfiguration('godotFiles', document).get('hover.previewResource')) {
            if (!/^(?:user|uid):\/\//.test(resPath)) {
                const mdPreview = await resPathPreview(resPath, document, token);
                if (token.isCancellationRequested)
                    return null;
                if (mdPreview)
                    hover.push(mdPreview);
            }
        }
        return new vscode_1.Hover(hover, wordRange);
    }
    async provideInlayHints(document, range, token) {
        const settings = vscode_1.workspace.getConfiguration('godotFiles', document);
        const clarifyVectors = settings.get('clarifyArrays.vector');
        const clarifyColors = settings.get('clarifyArrays.color');
        if (!supported || !clarifyVectors && !clarifyColors)
            return null;
        const gdasset = await this.parsedGDAsset(document, token);
        if (!gdasset || token.isCancellationRequested)
            return null;
        const hints = [];
        const reqStart = document.offsetAt(range.start);
        const reqSrc = document.getText(range);
        for (const m of reqSrc.matchAll(/\b(P(?:acked|ool)(?:Vector([234])|Color)Array)(\s*\(\s*)([\s,\w.+-]*?)\s*\)/g)) {
            const dim = m[2];
            if (dim && !clarifyVectors || !dim && !clarifyColors)
                continue;
            const ctorStart = reqStart + m.index;
            const ctorRange = new vscode_1.Range(document.positionAt(ctorStart), document.positionAt(ctorStart + m[0].length));
            if (gdasset.isNonCode(ctorRange))
                continue;
            const [, type, , paren, allArgs] = m;
            const typeEnd = ctorStart + type.length;
            const argsStart = typeEnd + paren.length;
            const regex = dim == '2' ? regex2Floats : dim == '3' ? regex3Floats : regex4Floats;
            for (const c of allArgs.matchAll(regex)) {
                const args = c[0];
                const itemPos = argsStart + c.index;
                const itemRange = new vscode_1.Range(document.positionAt(itemPos), document.positionAt(itemPos + args.length));
                const head = new vscode_1.InlayHint(itemRange.start, '(');
                const tail = new vscode_1.InlayHint(itemRange.end, ')');
                hints.push(head, tail);
            }
        }
        return hints;
    }
    async provideDocumentColors(document, token) {
        const settings = vscode_1.workspace.getConfiguration('godotFiles', document);
        const inlineColorSingles = settings.get('inlineColors.single');
        const inlineColorArrays = settings.get('inlineColors.array');
        if (!inlineColorSingles && !inlineColorArrays)
            return null;
        const gdasset = await this.parsedGDAsset(document, token);
        if (!gdasset || token.isCancellationRequested)
            return null;
        const colors = [];
        for (const m of document.getText().matchAll(/\b((?:Color|P(?:acked|ool)ColorArray)\s*\(\s*)([\s,\w.+-]*?)\s*\)/g)) {
            const prefix = m[1], isSingle = prefix[0] == 'C';
            if (isSingle && !inlineColorSingles || !isSingle && !inlineColorArrays)
                continue;
            let start = m.index;
            const ctorRange = new vscode_1.Range(document.positionAt(start), document.positionAt(start + m[0].length));
            if (gdasset.isNonCode(ctorRange))
                continue;
            if (isSingle) {
                const [red, green, blue, alpha] = m[2].split(/\s*,\s*/, 4).map(GDAsset.floatValue);
                colors.push(new vscode_1.ColorInformation(ctorRange, new vscode_1.Color(red ?? NaN, green ?? NaN, blue ?? NaN, alpha ?? NaN)));
                continue;
            }
            start += prefix.length;
            for (const c of m[2].matchAll(regex4Floats)) {
                const args = c[0];
                const itemPos = start + c.index;
                const itemRange = new vscode_1.Range(document.positionAt(itemPos), document.positionAt(itemPos + args.length));
                const [red, green, blue, alpha] = args.split(/\s*,\s*/, 4).map(GDAsset.floatValue);
                colors.push(new vscode_1.ColorInformation(itemRange, new vscode_1.Color(red ?? NaN, green ?? NaN, blue ?? NaN, alpha ?? 1)));
            }
        }
        return colors;
    }
    async provideColorPresentations(color, context, _token) {
        const { document, range } = context;
        if (document.languageId == 'config-definition')
            return [];
        const { red, green, blue, alpha } = color;
        const r = GDAsset.float16Code(red ?? NaN);
        const g = GDAsset.float16Code(green ?? NaN);
        const b = GDAsset.float16Code(blue ?? NaN);
        const a = GDAsset.float16Code(alpha ?? 1);
        const args = `${r}, ${g}, ${b}, ${a}`;
        const label = ok(red) && ok(green) && ok(blue) && ok(alpha)
            ? `#${hex(red)}${hex(green)}${hex(blue)}${hex(alpha)}` : `Color(${args})`;
        const colorPresentation = new vscode_1.ColorPresentation(label);
        const code = /^Color\s*\([\s,\w.+-]*\)$/.test(document.getText(range)) ? `Color(${args})` : args;
        colorPresentation.textEdit = new vscode_1.TextEdit(range, code);
        return [colorPresentation];
        function ok(c) { return c >= 0 && c <= 1; }
        function hex(c) { return Math.round(c * 255).toString(16).toUpperCase().replace(/^.$/s, '0$&'); }
    }
}
const regex2Floats = /(?:[\w.+-]+\s*,\s*)?[\w.+-]+/g;
const regex3Floats = /(?:[\w.+-]+\s*,\s*){0,2}[\w.+-]+/g;
const regex4Floats = /(?:[\w.+-]+\s*,\s*){0,3}[\w.+-]+/g;
function isPathWord(word, wordRange, document) {
    if (/^(?:res|user|uid|file):\/\/[^"\\]*$/.test(word))
        return true;
    const r = new vscode_1.Range(wordRange.start.line, 0, wordRange.end.line, wordRange.end.character + 1);
    const preWord = document.getText(r);
    return preWord[wordRange.start.character - 1] == '"' &&
        /^\s*\[\s*ext_resource\s+[^\n;#]*?\bpath\s*=\s*"(?:[^"\\]*)"$/.test(preWord);
}
function escCode(s) { return s.replace(/("|\\)/g, '\\$1'); }
function gdCodeLoad(resPath, id, type, language) {
    let code;
    if (type || id != null || /^(?:res|uid):\/\//.test(resPath)) {
        code = id != null ? `load("${resPath}::${id}")` : `preload("${resPath}")`;
        if (type)
            code += ` as ${type}`;
    }
    else {
        if (resPath.startsWith('file://'))
            resPath = vscode_1.Uri.parse(resPath).fsPath;
        code = `FileAccess.open("${escCode(resPath)}", FileAccess.READ)`;
    }
    return new vscode_1.MarkdownString().appendCodeblock(code, language);
}
async function projectDir(assetUri) {
    if (!resScheme.has(assetUri.scheme))
        return null;
    let uri = assetUri;
    do {
        const parent = vscode_1.Uri.joinPath(uri, '..');
        if (parent == uri)
            break;
        const parentPath = parent.path;
        if (parentPath == '..' || parentPath.endsWith('/..'))
            break;
        const projUri = vscode_1.Uri.joinPath(uri = parent, 'project.godot');
        try {
            await vscode_1.workspace.fs.stat(projUri);
            return parent;
        }
        catch { }
    } while (uri.path);
    return null;
}
exports.projectDir = projectDir;
const projGodotVersionRegex = /^\s*config\/features\s*=\s*PackedStringArray\s*\(\s*(.*?)\s*\)\s*(?:[;#].*)?$/m;
async function godotVersionOfProject(projectDirUri) {
    let projMeta;
    try {
        projMeta = toUTF8.decode(await vscode_1.workspace.fs.readFile(vscode_1.Uri.joinPath(projectDirUri, 'project.godot')));
    }
    catch {
        return null;
    }
    let m = projMeta.match(projGodotVersionRegex), dotnet = false;
    if (m && m[1]) {
        const features = m[1].split(/\s*,\s*/g).map(s => s.replace(/^"([^"\\]*)"$/, '$1'));
        if (features.includes('C#'))
            dotnet = true;
        m = features.map(s => s.match(/^((\d+)\.(\d+).*)$/)).find(m => m);
        if (m && m[1])
            return { api: m[1], major: +m[2], minor: +m[3], dotnet };
    }
    if (!dotnet)
        try {
            m = projMeta.match(/^\[dotnet\]\s*^\s*project\/assembly_name\s*=\s*"([^"\\]*)"\s*(?:[;#].*)?$/) ??
                projMeta.match(/^\[application\]\s*^\s*config\/name\s*=\s*"([^"\\]*)"\s*(?:[;#].*)?$/);
            const csProjName = m[1] + '.csproj';
            const csProj = toUTF8.decode(await vscode_1.workspace.fs.readFile(vscode_1.Uri.joinPath(projectDirUri, csProjName)));
            dotnet = true;
            m = csProj.match(/^<Project\s+Sdk\s*=\s*["']Godot\.NET\.Sdk\/((\d+)\.(\d+))(?:[^"'\\]*?)?["']>/i);
            return { api: m[1], major: +m[2], minor: +m[3], dotnet };
        }
        catch { }
    m = projMeta.match(/^\s*config_version\s*=\s*(\d+)\s*(?:[;#].*)?$/m);
    if (!m || !m[1])
        return null;
    const configVersion = +m[1];
    if (configVersion == 5)
        return { major: 4, dotnet };
    if (configVersion == 4)
        return { major: 3, dotnet };
    return null;
}
const assetGodotVersionRegex = /^\s*\[\s*gd_(?:resource|scene)(?:\s+\w+=(?:\d+|".*?"))*?\s+format=(\d+)\b.*?\]\s*(?:[;#].*)?$/m;
async function godotVersionOfDocument(document) {
    const projDir = await projectDir(document instanceof vscode_1.Uri ? document : document.uri);
    if (projDir) {
        const version = await godotVersionOfProject(projDir);
        if (version)
            return version;
    }
    if (document instanceof vscode_1.Uri)
        return null;
    const text = document.getText();
    const m = text.match(assetGodotVersionRegex);
    if (!m || !m[1])
        return null;
    const format = +m[1];
    const dotnet = /^\[ext_resource\s+type="Script"\s+path="[^"\\]*\.[cC][sS]".*?\]\s*(?:[;#].*)?$/.test(text);
    switch (format) {
        case 4:
        case 3: return { major: 4, dotnet };
        case 2: return { major: 3, dotnet };
        case 1: return { major: 2, dotnet };
    }
    return null;
}
const resScheme = new Set(['file', 'vscode-file', 'vscode-remote', 'vscode-remote-resource']);
async function resPathOfDocument(document) {
    const assetUri = document.uri;
    const assetPath = assetUri.path;
    const projDir = await projectDir(assetUri);
    if (projDir && assetPath.startsWith(projDir.path))
        return 'res:/' + assetPath.replace(projDir.path, '');
    return assetPath.replace(/^(?:.*\/)+/, '');
}
const uriRegex = /^[a-zA-Z][a-zA-Z0-9.+-]*:\/\/[^\x00-\x1F "<>\\^`{|}\x7F-\x9F]*$/;
async function locateResPath(resPath, document) {
    const assetUri = document.uri;
    let resUri;
    resPath = resPath.replace(/::[^:/\\]*$/, '');
    if (resPath.startsWith('res://')) {
        const projDir = await projectDir(assetUri);
        if (!projDir)
            return resPath;
        resUri = vscode_1.Uri.joinPath(projDir, resPath.substring(6));
    }
    else if (resPath.startsWith('file://')) {
        resUri = vscode_1.Uri.parse(resPath, true);
    }
    else if (/^\/|^[A-Z]:/.test(resPath)) {
        resUri = vscode_1.Uri.file(resPath);
    }
    else {
        if (uriRegex.test(resPath))
            return resPath;
        resUri = vscode_1.Uri.joinPath(assetUri, '..', resPath);
    }
    try {
        const resStat = await vscode_1.workspace.fs.stat(resUri);
        return { uri: resUri, stat: resStat };
    }
    catch (err) {
        if (err?.code == 'FileNotFound')
            return resUri.toString();
        throw err;
    }
}
const fontTest = `\
<tspan>JFK GOT MY VHS, PC AND XLR WEB QUIZ</tspan>
<tspan x='0' y='20'>new job: fix mr. gluck's hazy tv pdq!</tspan>
<tspan x='0' y='40'>Oo0 Ili1 Zz2 3 A4 S5 G6 T7 B8 g9</tspan>`;
async function resPathPreview(resPath, document, token) {
    const md = new vscode_1.MarkdownString();
    md.supportHtml = true;
    let resLoc;
    try {
        resLoc = await locateResPath(resPath, document);
        if (token.isCancellationRequested)
            return null;
    }
    catch (err) {
        const errName = err?.name ?? 'Error';
        const errMsg = err?.message ?? '';
        return md.appendMarkdown(`<div title="${errMsg}">${errName}!</div>`);
    }
    if (typeof resLoc == 'string')
        return md.appendMarkdown(`<div title="${resLoc}">Not found in local system</div>`);
    const { uri: resUri, stat: resStat } = resLoc;
    const resUriStr = resUri.toString();
    if (!(resStat.type & vscode_1.FileType.File))
        return resStat.type & vscode_1.FileType.Directory
            ? md.appendMarkdown(`<div title="${resUriStr}">Directory</div>`)
            : md.appendMarkdown(`<div title="${resUriStr}">Unkown</div>`);
    let match = /\.(svg|png|webp|jpe?g|bmp|gif)$/i.exec(resPath);
    if (match) {
        const ext = match[1].toLowerCase();
        const type = ext == 'svg' ? 'svg+xml' : ext == 'jpg' ? 'jpeg' : ext;
        const encodedBytesSize = Math.ceil(resStat.size / 3) * 4;
        const imgDataUrlSize = 19 + type.length + encodedBytesSize;
        const mdSize = 28 + imgDataUrlSize + resUriStr.length;
        if (mdSize <= 100_000) {
            md.baseUri = resUri;
            const bytes = await vscode_1.workspace.fs.readFile(resUri);
            const imgData = base64(bytes);
            const imgSrc = `data:image/${type};base64,${imgData}`;
            return md.appendMarkdown(`[<img height=128 src="${imgSrc}"/>](${resUriStr})`);
        }
        if (mdScheme.has(resUri.scheme))
            return md.appendMarkdown(`[<img height=128 src="${resUriStr}"/>](${resUriStr})`);
        const thumbSrc = await resThumb(resUri, token);
        if (thumbSrc)
            return md.appendMarkdown(`[<img src="${thumbSrc}"/>](${resUriStr})`);
        else
            return md.appendMarkdown(`[Image file](${resUriStr})`);
    }
    if (/\.(?:svgz|tga|dds|exr|hdr)$/i.test(resPath)) {
        const thumbSrc = await resThumb(resUri, token);
        if (thumbSrc)
            return md.appendMarkdown(`[<img src="${thumbSrc}"/>](${resUriStr})`);
        return md.appendMarkdown(`[Image file](${resUriStr})`);
    }
    match = /\.([to]tf|woff2?)$/i.exec(resPath);
    if (!match) {
        const thumbSrc = await resThumb(resUri, token);
        if (thumbSrc)
            return md.appendMarkdown(`[<img src="${thumbSrc}"/>](${resUriStr})`);
        return md.appendMarkdown(`[File](${resUriStr}) (${byteUnits(resStat.size)})`);
    }
    const type = match[1].toLowerCase();
    const fontDataUrlSize = 18 + type.length + Math.ceil(resStat.size / 3) * 4;
    const encodedImgSize = 275 + fontDataUrlSize + encodeDataURIText(fontTest).length;
    const imgDataUrlSize = 19 + encodedImgSize;
    const mdSize = 17 + imgDataUrlSize + resUriStr.length;
    if (mdSize <= 100_000) {
        const imgData = await svgFontTest(resUri, type);
        const imgSrc = `data:image/svg+xml,${encodeDataURIText(imgData)}`;
        return md.appendMarkdown(`[<img src="${imgSrc}"/>](${resUriStr})`);
    }
    const tmpUri = ctx.logUri;
    if (!mdScheme.has(tmpUri.scheme)) {
        return md.appendMarkdown(`[Font file](${resUriStr})`);
    }
    const imgSrc = vscode_1.Uri.joinPath(tmpUri, `font-preview-${jsHash(resUriStr)}-${resStat.mtime}.svg`);
    try {
        await vscode_1.workspace.fs.stat(imgSrc);
    }
    catch {
        if (token.isCancellationRequested)
            return null;
        try {
            const imgData = await svgFontTest(resUri, type);
            if (token.isCancellationRequested)
                return null;
            await vscode_1.workspace.fs.writeFile(imgSrc, fromUTF8.encode(imgData));
        }
        catch (err) {
            console.error(err);
            return md.appendMarkdown(`[Font file](${resUriStr})`);
        }
    }
    return md.appendMarkdown(`[<img src="${imgSrc}"/>](${resUriStr})`);
}
async function resThumb(resUri, token) {
    if (!nodejs || resUri.scheme != 'file')
        return null;
    const resPathHash = md5(resUri.fsPath
        .replace(/^[a-z]:/, g0 => g0.toUpperCase()).replaceAll('\\', '/'));
    if (!resPathHash)
        return null;
    const platform = process.platform;
    const cachePaths = vscode_1.workspace.getConfiguration('godotFiles')
        .get('godotCachePath')[platform] ?? [];
    let lastThumbUri = null, lastModifiedTime = -Infinity;
    for (const cachePathString of cachePaths) {
        const cachePath = cachePathString.replace(/^~(?=\/)|\$\{userHome\}/g, g0 => homedir ?? g0)
            .replace(/\$\{env:(\w+)\}/g, (g0, g1) => process.env[g1] ?? g0)
            .replace(/\$\{workspaceFolder(?::(.*?))?\}/g, (g0, g1) => !g1
            ? (vscode_1.workspace.getWorkspaceFolder(resUri) ?? vscode_1.workspace.workspaceFolders?.[0])?.uri.fsPath ?? g0
            : vscode_1.workspace.workspaceFolders?.find(f => f.name == g1)?.uri.fsPath ?? g0);
        const thumbUri = vscode_1.Uri.joinPath(vscode_1.Uri.file(cachePath), `resthumb-${resPathHash}.png`);
        try {
            const stat = await vscode_1.workspace.fs.stat(thumbUri);
            if (token.isCancellationRequested)
                return null;
            const mtime = stat.mtime, size = stat.size;
            if (lastModifiedTime >= mtime || size <= 90 || size > 74000)
                continue;
            lastModifiedTime = mtime;
            lastThumbUri = thumbUri;
        }
        catch {
            continue;
        }
    }
    if (lastThumbUri == null)
        return null;
    try {
        const bytes = await vscode_1.workspace.fs.readFile(lastThumbUri);
        return 'data:image/png;base64,' + base64(bytes);
    }
    catch {
        return null;
    }
}
exports.resThumb = resThumb;
async function svgFontTest(fontUri, type) {
    const bytes = await vscode_1.workspace.fs.readFile(fontUri);
    const dataUrl = `data:font/${type};base64,${base64(bytes)}`;
    return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='80'><style>
svg{background:white;margin:4px}
@font-face{font-family:_;src:url('${dataUrl}')}
text{font-family:_;dominant-baseline:text-before-edge}
</style><text>
${fontTest}
</text></svg>`;
}
const mdScheme = new Set(['data', 'file', 'https', 'vscode-file', 'vscode-remote', 'vscode-remote-resource', 'mailto']);
const onlineDocsHost = 'docs.godotengine.org';
const latestApiGodot3 = '3.6';
const latestApiGodot2 = '2.1';
function apiVersion(gdVersion) {
    if (gdVersion == null)
        return 'stable';
    if (gdVersion.api)
        return gdVersion.api;
    const major = gdVersion.major;
    return major <= 2 ? latestApiGodot2 : major == 3 ? latestApiGodot3 : 'stable';
}
class GodotDocumentationProvider {
    static viewType = 'godotFiles.docsBrowser';
    static webviewPanels = new Map();
    static navigationHistoryBuffer = new Map();
    static detectedDotnetBuffer = new Map();
    static parseUri(uri) {
        const { path, fragment } = uri;
        const [, viewer, urlPath, title] = path.match(/^.*?\/godot-docs\.([\w-]+)\.ide:\/(.*?)\/([^/]+)$/) ?? [];
        const urlFragment = fragment ? '#' + fragment : '';
        return { path, viewer, urlPath, title, fragment, urlFragment };
    }
    static parseUrlPath(urlPath) {
        const [, locale, version, page] = urlPath.match(/^([\w-]+)\/([^/]+)\/([^#]+\.html)$/)
            ?? ['', 'en', 'stable', '404.html'];
        return { locale, version, page };
    }
    static setCanNavigate(history) {
        const canGoBack = history.back.length != 0, canGoForward = history.forward.length != 0;
        vscode_1.commands.executeCommand('setContext', 'godotFiles.activeDocsPage.canNavigateBack', canGoBack);
        vscode_1.commands.executeCommand('setContext', 'godotFiles.activeDocsPage.canNavigateForward', canGoForward);
    }
    async openCustomDocument(uri, openContext, token) {
        return { uri: uri, dispose() { }, };
    }
    async resolveCustomEditor(document, webviewPanel, token) {
        const docsPageUri = document.uri, uriString = docsPageUri.toString();
        const browserWebviewPanel = webviewPanel;
        const history = GodotDocumentationProvider.navigationHistoryBuffer.get(uriString) ??
            { back: [], forward: [] };
        GodotDocumentationProvider.navigationHistoryBuffer.delete(uriString);
        browserWebviewPanel._godotFiles_currentUri = uriString;
        browserWebviewPanel._godotFiles_history = history;
        GodotDocumentationProvider.setCanNavigate(history);
        webviewPanel.onDidChangeViewState(event => {
            if (!event.webviewPanel.active)
                return;
            const history = GodotDocumentationProvider.navigationHistoryBuffer.get(uriString);
            if (history) {
                GodotDocumentationProvider.navigationHistoryBuffer.delete(uriString);
                if (history.back.length != 0)
                    browserWebviewPanel._godotFiles_history.back.push(uriString, ...history.back);
                if (history.forward.length != 0)
                    browserWebviewPanel._godotFiles_history.forward.unshift(...history.forward, uriString);
            }
            GodotDocumentationProvider.setCanNavigate(browserWebviewPanel._godotFiles_history);
        });
        GodotDocumentationProvider.webviewPanels.set(uriString, browserWebviewPanel);
        const dotnet = GodotDocumentationProvider.detectedDotnetBuffer.get(uriString);
        GodotDocumentationProvider.detectedDotnetBuffer.delete(uriString);
        webviewPanel.onDidDispose(() => GodotDocumentationProvider.webviewPanels.delete(uriString));
        const { path, viewer, urlPath, title, urlFragment } = GodotDocumentationProvider.parseUri(docsPageUri);
        if (viewer == 'webview') {
            try {
                await loadDocsInTab(urlPath, urlFragment, dotnet, browserWebviewPanel, token);
                return;
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        }
        else if (viewer == 'browser') {
            const url = `https://${onlineDocsHost}/${urlPath}${urlFragment}`;
            if (!await vscode_1.env.openExternal(vscode_1.Uri.parse(url, true)))
                vscode_1.window.showErrorMessage(`Could not open documentation for "${title}" in browser. URL: ${url}`);
        }
        else
            vscode_1.window.showErrorMessage('Documentation viewer could not open path: ' + path);
        webviewPanel.dispose();
    }
}
const pos0 = new vscode_1.Position(0, 0);
async function apiDocs(document, className, memberName, token) {
    const config = vscode_1.workspace.getConfiguration('godotFiles', document);
    const viewer = supported ? config.get('documentation.viewer') : 'godot-tools';
    if (viewer != 'godot-tools' && await isOnline()) {
        const apiLocale = 'en';
        const gdVersion = await godotVersionOfDocument(document);
        if (token?.isCancellationRequested)
            return null;
        try {
            const docUri = apiDocsPageUri(className, memberName, gdVersion, apiLocale, viewer);
            if (viewer == 'webview')
                GodotDocumentationProvider.detectedDotnetBuffer.set(docUri.toString(), !!gdVersion?.dotnet);
            return new vscode_1.Location(docUri, pos0);
        }
        catch (e) {
            console.error(e);
        }
    }
    else if (vscode_1.extensions.getExtension('geequlim.godot-tools')?.isActive) {
        const uri = vscode_1.Uri.from({ scheme: 'gddoc', path: className + '.gddoc', fragment: memberName || undefined });
        return new vscode_1.Location(uri, pos0);
    }
    const reason = viewer == 'godot-tools' ? 'Is the godot-tools extension running?' : 'Are you online?';
    vscode_1.window.showErrorMessage(`Could not open documentation for ${className}. ${reason}`);
    return null;
}
function apiDocsPageUri(className, memberName, gdVersion, locale, viewer) {
    const version = apiVersion(gdVersion);
    const classLower = className.toLowerCase();
    const page = `classes/class_${classLower}.html`;
    const fragment = '#class-' + classLower + (!memberName ? '' :
        `-${version == '3.0' || version == '2.1' ? '' : 'property-'}${memberName.replaceAll('_', '-')}`);
    return docsPageUri(viewer, `${locale}/${version}/${page}`, className, fragment);
}
function docsPageUri(viewer, urlPath, title, fragment) {
    const filename = encodeURIComponent(title);
    return vscode_1.Uri.parse(`untitled:${ctx.extension.id}/godot-docs.${viewer}.ide:/${urlPath}/${filename}${fragment}`);
}
const docsPageCache = new Map();
async function fetchDocsPage(urlPath, token) {
    const docsUrl = `https://${onlineDocsHost}/${urlPath}`;
    let response;
    try {
        response = await fetch(docsUrl);
    }
    catch (e) {
        const cause = e?.cause;
        if (cause)
            console.error(cause);
        throw e;
    }
    if (!response.ok)
        throw new Error(`Error fetching Godot docs: ${response.status} (${response.statusText}) ${docsUrl}`);
    if (token?.isCancellationRequested)
        return { docsUrl, title: '', html: '' };
    const html = await response.text();
    const title = (html.match(/<meta\s+property\s*=\s*"og:title"\s+content\s*=\s*"(.*?)(?: \u2013[^"]*)?"\s*\/?>/i)?.[1] ||
        html.match(/<title>(.*?)(?: &mdash;[^<]*)?<\/title>/i)?.[1] || 'Godot Docs').replaceAll('/', '\u29F8');
    return { docsUrl, title, html };
}
async function loadDocsInTab(urlPath, urlFragment, dotnet, webviewPanel, token) {
    const cachedPage = docsPageCache.get(urlPath);
    if (cachedPage)
        docsPageCache.delete(urlPath);
    const { docsUrl, title, html } = cachedPage ?? await fetchDocsPage(urlPath, token);
    console.info('Godot Files :: Fetched in docs webview: ' + docsUrl + urlFragment);
    if (token?.isCancellationRequested)
        return;
    const { locale, page } = GodotDocumentationProvider.parseUrlPath(urlPath);
    let className = '';
    if (page.match(/^classes\/class_(@?\w+)\.html(?:\?.*)?$/)?.[1] == title.toLowerCase()) {
        className = title;
    }
    const classLower = className.toLowerCase();
    const webview = webviewPanel.webview;
    webview.options = { localResourceRoots: [], enableScripts: true };
    webview.onDidReceiveMessage(onDocsTabMessage, webviewPanel);
    const p = `https://${onlineDocsHost.replace(/^docs\./, '*.')}/${locale}/`;
    const csp = `default-src data: https:; script-src 'unsafe-inline' ${p}; style-src 'unsafe-inline' ${p}`;
    const hideNav = page != 'index.html' &&
        vscode_1.workspace.getConfiguration('godotFiles.documentation.webview').get('hideSidebar');
    const injectHead = hideNav ? `<style>
body.wy-body-for-nav { margin: unset }
nav.wy-nav-top, nav.wy-nav-side, div.rst-versions, div.rst-footer-buttons { display: none }
section.wy-nav-content-wrap, div.wy-nav-content { margin: auto }
</style>` : '';
    const codeLang = dotnet ? 'C#' : dotnet == false ? 'GDScript' : '';
    const template = docsWebviewInjectHtmlTemplate ?? (docsWebviewInjectHtmlTemplate = toUTF8.decode(await vscode_1.workspace.fs.readFile(vscode_1.Uri.joinPath(ctx.extensionUri, 'lang.godot-docs/godot-docs-webview.inject.htm'))));
    const insertVar = { docsUrl, injectHead, urlFragment, classLower, locale, csp, codeLang };
    const injectedHead = template.replace(/%\{(\w+)\}/g, (_s, v) => insertVar[v] ?? '');
    const pageId = page.replace(/\.html(?:\?.*)?$/, '');
    const userNotes = `Open this page in your external browser to load comments, or <a href="\
https://github.com/godotengine/godot-docs-user-notes/discussions/categories/user-contributed-notes?discussions_q=\
%22${encodeURIComponent(pageId)}%22">find its discussion on GitHub</a> if available.<br/>`;
    const finalHtml = html
        .replace(/(?<=<head>\s*(?:<meta\s+charset\s*=\s*["']utf-8["']\s*\/?>)?)/i, injectedHead)
        .replace(/(?<=<div\s+id\s*=\s*["']godot-giscus["']>\s*<hr\s*\/?>\s*<h2>\s*[\w\s-]*\s*<\/h2>\s*<p>)/i, userNotes);
    if (webview.html)
        webview.html = '';
    webview.html = finalHtml;
}
let docsWebviewInjectHtmlTemplate;
async function onDocsTabMessage(msg) {
    if (msg.navigateTo != undefined) {
        const exitUri = await docsTabMsgNavigate(msg);
        if (exitUri) {
            const destination = exitUri.toString();
            GodotDocumentationProvider.navigationHistoryBuffer.set(destination, { back: this._godotFiles_history.back.concat(this._godotFiles_currentUri), forward: [] });
            await vscode_1.commands.executeCommand('vscode.openWith', exitUri, GodotDocumentationProvider.viewType);
            this.dispose();
        }
    }
    else if (msg.newFragment != undefined) {
        this._godotFiles_overrideFragment = msg.newFragment;
    }
    else
        console.error('Godot Files :: Unknown message: ', msg);
}
async function docsTabMsgNavigate(msg) {
    const origin = `https://${onlineDocsHost}/`;
    const url = msg.navigateTo.replace(/^http:/i, 'https:')
        .replace(/^vscode-webview:\/\/[^/]*\/index\.html\//, origin + 'en/');
    if (!url.startsWith('https:')) {
        console.warn('Refusing to navigate to this scheme: ' + url);
        return null;
    }
    let m;
    if (!url.startsWith(origin) || !(m =
        url.substring(origin.length).replace(/\/(?=(?:#.*)?$)/, '/index.html').match(/^([\w-]+\/[^/]+\/[^#]+\.html)(#.*)?$/))) {
        if (!await vscode_1.env.openExternal(vscode_1.Uri.parse(url, true)))
            vscode_1.window.showErrorMessage('Could not open URL in browser: ' + url);
        return null;
    }
    const [, urlPath, fragment] = m;
    try {
        const docsPage = await fetchDocsPage(urlPath, null);
        docsPageCache.set(urlPath, docsPage);
        const docUri = docsPageUri('webview', `${urlPath}`, docsPage.title, fragment ?? '');
        const exit = msg.exitThisPage &&
            !vscode_1.workspace.getConfiguration('godotFiles.documentation.webview').get('keepTabs');
        if (exit)
            return docUri;
        await vscode_1.commands.executeCommand('vscode.openWith', docUri, GodotDocumentationProvider.viewType);
        return null;
    }
    catch (e) {
        console.error(e);
        vscode_1.window.showErrorMessage('Could not open URL in webview: ' + url, 'Open in browser').then(async (btn) => {
            if (btn && !await vscode_1.env.openExternal(vscode_1.Uri.parse(url, true)))
                vscode_1.window.showErrorMessage('Could not open URL in browser: ' + url);
        });
        return null;
    }
}
async function openApiDocs() {
    if (!supported) {
        vscode_1.window.showErrorMessage('Only available in early access.');
        return;
    }
    const document = vscode_1.window.activeTextEditor?.document;
    let configScope, gdVersion;
    if (document) {
        configScope = document;
        gdVersion = await godotVersionOfDocument(document);
    }
    else {
        const tabInput = vscode_1.window.tabGroups.activeTabGroup.activeTab?.input;
        const activeTabUri = tabInput && (tabInput.uri ?? tabInput.modified);
        if (activeTabUri && tabInput.viewType == GodotDocumentationProvider.viewType) {
            const { locale, version } = GodotDocumentationProvider.parseUrlPath(GodotDocumentationProvider.parseUri(activeTabUri).urlPath);
            const docUri = docsPageUri('webview', `${locale}/${version}/classes/index.html`, 'All classes', '');
            await vscode_1.commands.executeCommand('vscode.openWith', docUri, GodotDocumentationProvider.viewType);
            return;
        }
        const workspaceFolder = (activeTabUri && vscode_1.workspace.getWorkspaceFolder(activeTabUri))
            ?? vscode_1.workspace.workspaceFolders?.[0];
        configScope = activeTabUri ?? workspaceFolder;
        gdVersion = (activeTabUri && await godotVersionOfDocument(activeTabUri))
            ?? (workspaceFolder ? await godotVersionOfProject(workspaceFolder.uri) : null);
    }
    const viewer = vscode_1.workspace.getConfiguration('godotFiles.documentation', configScope)
        .get('viewer') == 'webview' ? 'webview' : 'browser';
    const locale = 'en';
    const version = apiVersion(gdVersion);
    const docUri = docsPageUri(viewer, `${locale}/${version}/classes/index.html`, 'All classes', '');
    if (viewer == 'webview')
        GodotDocumentationProvider.detectedDotnetBuffer.set(docUri.toString(), !!gdVersion?.dotnet);
    await vscode_1.commands.executeCommand('vscode.openWith', docUri, GodotDocumentationProvider.viewType);
}
function getActiveDocsUri() {
    const tabInput = vscode_1.window.tabGroups.activeTabGroup.activeTab?.input;
    if (tabInput && tabInput.viewType == GodotDocumentationProvider.viewType && tabInput.uri)
        return tabInput.uri;
    for (const tabGroup of vscode_1.window.tabGroups.all) {
        const tabInput = tabGroup.activeTab?.input;
        if (tabInput && tabInput.viewType == GodotDocumentationProvider.viewType && tabInput.uri)
            return tabInput.uri;
    }
    vscode_1.window.showErrorMessage('Could not find an URI of an active Godot Docs Page tab! (Floating window?)');
    throw new Error();
}
async function activeDocsGoBack() {
    const docsTabUri = getActiveDocsUri(), uriString = docsTabUri.toString();
    const webviewPanel = GodotDocumentationProvider.webviewPanels.get(uriString);
    if (!webviewPanel)
        throw new Error('WebviewPanel not found! (Floating Window?) URI: ' + uriString);
    const history = webviewPanel._godotFiles_history;
    const previousUriString = history.back.pop();
    if (!previousUriString)
        return;
    history.forward.unshift(webviewPanel._godotFiles_currentUri);
    GodotDocumentationProvider.navigationHistoryBuffer.set(previousUriString, history);
    const previousUri = vscode_1.Uri.parse(previousUriString, true);
    await vscode_1.commands.executeCommand('vscode.openWith', previousUri, GodotDocumentationProvider.viewType);
    webviewPanel.dispose();
}
async function activeDocsGoForward() {
    const docsTabUri = getActiveDocsUri(), uriString = docsTabUri.toString();
    const webviewPanel = GodotDocumentationProvider.webviewPanels.get(uriString);
    if (!webviewPanel)
        throw new Error('WebviewPanel not found! (Floating Window?) URI: ' + uriString);
    const history = webviewPanel._godotFiles_history;
    const nextUriString = history.forward.shift();
    if (!nextUriString)
        return;
    history.back.push(webviewPanel._godotFiles_currentUri);
    GodotDocumentationProvider.navigationHistoryBuffer.set(nextUriString, history);
    const nextUri = vscode_1.Uri.parse(nextUriString, true);
    await vscode_1.commands.executeCommand('vscode.openWith', nextUri, GodotDocumentationProvider.viewType);
    webviewPanel.dispose();
}
async function activeDocsReload() {
    const docsTabUri = getActiveDocsUri(), uriString = docsTabUri.toString();
    const webviewPanel = GodotDocumentationProvider.webviewPanels.get(uriString);
    if (!webviewPanel)
        throw new Error('WebviewPanel not found! (Floating Window?) URI: ' + uriString);
    const newFragment = webviewPanel._godotFiles_overrideFragment;
    const { urlPath, urlFragment } = GodotDocumentationProvider.parseUri(docsTabUri);
    const dotnet = GodotDocumentationProvider.detectedDotnetBuffer.get(uriString);
    GodotDocumentationProvider.detectedDotnetBuffer.delete(uriString);
    await loadDocsInTab(urlPath, newFragment != undefined ? '#' + newFragment : urlFragment, dotnet, webviewPanel, null);
}
async function activeDocsOpenInBrowser() {
    const docsTabUri = getActiveDocsUri(), uriString = docsTabUri.toString();
    const webviewPanel = GodotDocumentationProvider.webviewPanels.get(uriString);
    const newFragment = webviewPanel?._godotFiles_overrideFragment;
    const { urlPath, fragment } = GodotDocumentationProvider.parseUri(docsTabUri);
    const url = vscode_1.Uri.from({
        scheme: 'https', authority: onlineDocsHost, path: '/' + urlPath, fragment: newFragment ?? fragment
    });
    if (!await vscode_1.env.openExternal(url))
        vscode_1.window.showErrorMessage('Could not open URL in browser: ' + url);
}
async function activeDocsFindNext() {
    await vscode_1.commands.executeCommand('editor.action.webvieweditor.findNext');
}
async function activeDocsFindPrevious() {
    await vscode_1.commands.executeCommand('editor.action.webvieweditor.findPrevious');
}
async function unlockEarlyAccess() {
    if (supported) {
        if (await vscode_1.window.showInformationMessage('Early access is already enabled.', 'OK', 'Disable') == 'Disable') {
            supported = false;
            ctx.globalState.update('supportKey', undefined);
        }
        return;
    }
    const password = await vscode_1.window.showInputBox({
        title: 'Password to unlock early access:',
        placeHolder: 'A password is received when making a donation.',
        password: true,
        prompt: 'Check the README page for more info.'
    });
    if (!password)
        return;
    const hash = await sha512(password);
    if (hash != checksum) {
        vscode_1.window.showErrorMessage('Incorrect password. Paste it exactly like you received when donating.');
        return;
    }
    supported = true;
    ctx.globalState.update('supportKey', hash);
    vscode_1.window.showInformationMessage('Thank you for the support! ❤️\nEarly access is now unlocked, just for you. 😊');
}
const deleteRecursive = { recursive: true, useTrash: false };
async function del(uri) {
    try {
        await vscode_1.workspace.fs.delete(uri, deleteRecursive);
    }
    catch { }
}
let ctx;
let supported = false;
async function activate(context) {
    if (!vscode_1.workspace.isTrusted) {
        context.subscriptions.push(vscode_1.workspace.onDidGrantWorkspaceTrust(() => { activate(context); }));
        return;
    }
    ctx = context;
    if (ctx.storageUri)
        del(ctx.storageUri);
    del(ctx.globalStorageUri);
    ctx.globalState.setKeysForSync([]);
    if (ctx.globalState.get('supportKey') == checksum)
        supported = true;
    ctx.subscriptions.push(vscode_1.commands.registerCommand('godotFiles.unlockEarlyAccess', unlockEarlyAccess));
    ctx.subscriptions.push(vscode_1.window.registerCustomEditorProvider(GodotDocumentationProvider.viewType, new GodotDocumentationProvider(), {
        webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true }
    }), vscode_1.commands.registerCommand('godotFiles.openApiDocs', openApiDocs), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.navigateBack', activeDocsGoBack), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.navigateForward', activeDocsGoForward), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.reload', activeDocsReload), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.openInBrowser', activeDocsOpenInBrowser), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.findNext', activeDocsFindNext), vscode_1.commands.registerCommand('godotFiles.activeDocsPage.findPrevious', activeDocsFindPrevious));
    const provider = new GDAssetProvider();
    ctx.subscriptions.push(vscode_1.languages.registerDocumentSymbolProvider(GDAssetProvider.docs, provider), vscode_1.languages.registerDefinitionProvider(GDAssetProvider.godotDocs, provider), vscode_1.languages.registerHoverProvider(GDAssetProvider.godotDocs, provider), vscode_1.languages.registerInlayHintsProvider(GDAssetProvider.godotDocs, provider), vscode_1.languages.registerColorProvider(GDAssetProvider.godotDocs, provider));
}
exports.activate = activate;
function deactivate() {
    const tmpUri = ctx?.logUri;
    if (!tmpUri)
        return;
    if (tmpUri.scheme == 'file')
        try {
            nodejs && require('fs').rmSync(tmpUri.fsPath, { force: true, recursive: true });
        }
        catch { }
}
exports.deactivate = deactivate;
const checksum = '1ee835486c75add4e298d9120c62801254ecb9f69309f1f67af4d3495bdf7ba14e288b73298311f5ef7839ec34bfc12211a035911d3ad19a60e822a9f44d4d5c';
//# sourceMappingURL=extension.js.map