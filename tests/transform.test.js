const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRuntime() {
    const context = {};
    vm.createContext(context);

    for (const relPath of ['content/constants.js', 'content/parser.js', 'content/transform.js']) {
        const absPath = path.resolve(__dirname, '..', relPath);
        const code = fs.readFileSync(absPath, 'utf8');
        vm.runInContext(code, context, { filename: absPath });
    }

    return context;
}

test('실제 package 선언 줄은 제거된다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = 'package com.example;\npublic class Main {}\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe('public class Main {}\n');
});

test('주석 안의 package 텍스트는 제거하지 않는다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = '// package demo.fake;\npublic class Main {}\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe(input);
});

test('문자열 안의 package 텍스트는 제거하지 않는다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = 'public class Main { String s = "package demo.fake;"; }\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe(input);
});

test('package 줄 뒤에 주석 토큰이 있어도 해당 줄 전체를 제거한다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = 'package demo; /* keep closed later */\nimport java.util.*;\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe('import java.util.*;\n');
});

test('package 제거 후 파일 시작부의 빈 줄을 정리해 import가 최상단으로 온다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = 'package demo;\n\n\nimport java.util.*;\nclass Main {}\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe('import java.util.*;\nclass Main {}\n');
});

test('주석의 package 텍스트만 있을 때는 Java 코드로 보지 않는다', () => {
    const { looksLikeJavaCode } = loadRuntime();
    const input = '// package demo.fake;\njust text\n';

    expect(looksLikeJavaCode(input)).toBe(false);
});

test('main을 실제로 포함한 클래스만 Main으로 변경한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class Alpha {',
        '    public static void main(String[] args) {}',
        '}',
        'class Beta {}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');

    expect(output).toMatch(/public class Main/);
    expect(output).toMatch(/class Beta/);
    expect(output).not.toMatch(/class Alpha/);
});

test('main 시그니처가 주석에만 있으면 클래스명을 바꾸지 않는다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class KeepMe {',
        '    // public static void main(String[] args) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');

    expect(output).toBe(input);
});

test('SWEA 호스트에서는 클래스명을 Solution으로 변경한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'package demo;',
        'public class Demo {',
        '    public static void main(String[] args) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'swexpertacademy.com');

    expect(output).toMatch(/class Solution/);
    expect(output).not.toMatch(/package demo;/);
});
