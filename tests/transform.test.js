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

test('www SWEA 호스트에서도 클래스명을 Solution으로 변경한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'package demo;',
        'public class Demo {',
        '    public static void main(String[] args) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.swexpertacademy.com');

    expect(output).toMatch(/class Solution/);
    expect(output).not.toMatch(/package demo;/);
});

test('자바 텍스트 블록 안의 package 텍스트는 제거하지 않는다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = [
        'public class Main {',
        '    String s = """',
        'package demo.fake;',
        'hello',
        '""";',
        '}',
        ''
    ].join('\n');

    const output = removePackageDeclaration(input);
    expect(output).toBe(input);
});

test('자바 텍스트 블록 안의 main 시그니처는 클래스명 변경 트리거가 아니다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class KeepMe {',
        '    String s = """',
        'public static void main(String[] args) {}',
        '""";',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');
    expect(output).toBe(input);
});

test('CRLF 줄바꿈에서도 package 줄 제거 후 import가 최상단으로 온다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = 'package demo;\r\n\r\nimport java.io.*;\r\nclass Main {}\r\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe('import java.io.*;\r\nclass Main {}\r\n');
});

test('중첩 클래스의 main일 때는 해당 중첩 클래스명만 변경한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class Outer {',
        '    static class Inner {',
        '        public static void main(String[] args) {}',
        '    }',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');
    expect(output).toMatch(/class Outer/);
    expect(output).toMatch(/static class Main/);
    expect(output).not.toMatch(/class Inner/);
});

test('class 선언과 import java가 있으면 Java 코드로 판단한다', () => {
    const { looksLikeJavaCode } = loadRuntime();
    const input = [
        'import java.util.*;',
        'class Demo {}',
        ''
    ].join('\n');

    expect(looksLikeJavaCode(input)).toBe(true);
});

test('멀티라인 블록 주석 내부 package 텍스트는 Java 판별 신호로 쓰지 않는다', () => {
    const { looksLikeJavaCode } = loadRuntime();
    const input = [
        '/*',
        'package fake.demo;',
        '*/',
        'plain text only',
        ''
    ].join('\n');

    expect(looksLikeJavaCode(input)).toBe(false);
});

test('제거할 package가 없으면 선행 빈 줄을 임의로 정리하지 않는다', () => {
    const { removePackageDeclaration } = loadRuntime();
    const input = '\n\nimport java.util.*;\nclass Main {}\n';
    const output = removePackageDeclaration(input);

    expect(output).toBe(input);
});

test('주석에 package와 psvm이 모두 있어도 실제 코드 기준으로만 변환한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        '// package fake.comment;',
        '// public static void main(String[] args) {}',
        'package real.demo;',
        '',
        'public class RealRun {',
        '    public static void main(String[] args) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');

    expect(output).toContain('// package fake.comment;');
    expect(output).toContain('// public static void main(String[] args) {}');
    expect(output).not.toMatch(/\bpackage real\.demo;/);
    expect(output).toMatch(/public class Main/);
    expect(output).not.toMatch(/public class RealRun/);
});

test('main 파라미터 변수명이 args가 아니어도 인식한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class Demo {',
        '    public static void main(String[] inputValue) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');
    expect(output).toMatch(/public class Main/);
    expect(output).not.toMatch(/public class Demo/);
});

test('main varargs(String...) 시그니처도 인식한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class Demo {',
        '    public static void main(String... argv) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.acmicpc.net');
    expect(output).toMatch(/public class Main/);
});

test('main 배열 파라미터 후위 표기(String args[])도 인식한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'public class Demo {',
        '    public static void main(String args[]) {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'swexpertacademy.com');
    expect(output).toMatch(/class Solution/);
    expect(output).not.toMatch(/class Demo/);
});

test('SWEA 제출 형태 코드도 Solution으로 변환한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'package swea;',
        '',
        'import java.io.*;',
        'import java.util.*;',
        '',
        'public class Solution {',
        '    public static void main(String args[]) throws Exception {',
        '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
        '        int T = Integer.parseInt(br.readLine());',
        '        for (int tc = 1; tc <= T; tc++) {',
        '            System.out.println("#" + tc);',
        '        }',
        '    }',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'swexpertacademy.com');

    expect(output).toContain('class Solution');
    expect(output).not.toContain('package swea;');
    expect(output).toContain('public static void main(String args[]) throws Exception {');
});

test('www SWEA 호스트에서도 후위 배열 표기 main을 유지한 채 Solution으로 변환한다', () => {
    const { transformJavaPasteText } = loadRuntime();
    const input = [
        'package example;',
        'public class Demo {',
        '    public static void main(String args[]) throws Exception {}',
        '}',
        ''
    ].join('\n');

    const output = transformJavaPasteText(input, 'www.swexpertacademy.com');

    expect(output).toContain('class Solution');
    expect(output).toContain('main(String args[]) throws Exception');
    expect(output).not.toContain('package example;');
    expect(output).not.toContain('class Demo');
});

test('String 파라미터가 없는 main 시그니처는 Java 판단 기준으로 쓰지 않는다', () => {
    const { looksLikeJavaCode } = loadRuntime();
    const input = [
        'class Demo {',
        '    static void main() {}',
        '}',
        ''
    ].join('\n');

    expect(looksLikeJavaCode(input)).toBe(false);
});
