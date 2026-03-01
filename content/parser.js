function maskJavaCommentsAndStrings(code) {
    let out = '';
    let state = 'normal';

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const next = code[i + 1];

        if (state === 'normal') {
            if (ch === '/' && next === '/') {
                out += '  ';
                i++;
                state = 'lineComment';
                continue;
            }
            if (ch === '/' && next === '*') {
                out += '  ';
                i++;
                state = 'blockComment';
                continue;
            }
            if (ch === '"') {
                out += ' ';
                state = 'string';
                continue;
            }
            if (ch === "'") {
                out += ' ';
                state = 'char';
                continue;
            }
            out += ch;
            continue;
        }

        if (state === 'lineComment') {
            if (ch === '\n') {
                out += '\n';
                state = 'normal';
            } else {
                out += ' ';
            }
            continue;
        }

        if (state === 'blockComment') {
            if (ch === '*' && next === '/') {
                out += '  ';
                i++;
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
            continue;
        }

        if (state === 'string') {
            if (ch === '\\' && i + 1 < code.length) {
                out += '  ';
                i++;
                continue;
            }
            if (ch === '"') {
                out += ' ';
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
            continue;
        }

        if (state === 'char') {
            if (ch === '\\' && i + 1 < code.length) {
                out += '  ';
                i++;
                continue;
            }
            if (ch === "'") {
                out += ' ';
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
        }
    }

    return out;
}

function findMainMethodIndex(maskedCode) {
    const match = maskedCode.match(MAIN_METHOD_REGEX);
    return match ? match.index : -1;
}

function replaceLastClassName(source, maskedSource, replacementClassName) {
    let lastMatch = null;
    let match;

    CLASS_NAME_REGEX.lastIndex = 0;
    while ((match = CLASS_NAME_REGEX.exec(maskedSource)) !== null) {
        lastMatch = match;
    }

    if (!lastMatch) return source;

    const originalDecl = lastMatch[0];
    const originalName = lastMatch[1];
    const nameStart = lastMatch.index + originalDecl.length - originalName.length;
    const nameEnd = nameStart + originalName.length;

    return source.substring(0, nameStart) + replacementClassName + source.substring(nameEnd);
}

function renameMainClass(code, replacementDecl) {
    const masked = maskJavaCommentsAndStrings(code);
    const replacementClassName = replacementDecl.trim().split(/\s+/).pop();
    if (!replacementClassName) return code;

    const mainIdx = findMainMethodIndex(masked);
    if (mainIdx === -1) return code;

    const beforeMainMasked = masked.substring(0, mainIdx);
    let depth = 0;

    for (let i = beforeMainMasked.length - 1; i >= 0; i--) {
        if (beforeMainMasked[i] === '}') depth++;
        if (beforeMainMasked[i] === '{') depth--;

        if (depth === -1) {
            const header = code.substring(0, i);
            const headerMasked = masked.substring(0, i);
            const replacedHeader = replaceLastClassName(header, headerMasked, replacementClassName);
            return replacedHeader + code.substring(i);
        }
    }

    return replaceLastClassName(code, masked, replacementClassName);
}
