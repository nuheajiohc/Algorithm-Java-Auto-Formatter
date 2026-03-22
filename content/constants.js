const EDITOR_SELECTOR = 'textarea, [contenteditable="true"], .CodeMirror, .cm-editor, .monaco-editor, [role="textbox"]';
const SWEA_HOST_KEYWORD = 'swexpertacademy.com';

const MAIN_METHOD_REGEX = /\b(?:public|protected|private|final|synchronized|native|strictfp|\s)*\bstatic\b(?:\s+\b(?:final|synchronized|native|strictfp)\b)*\s+void\s+main\s*\(\s*(?:final\s+)?String(?:\s*\[\s*\]|\s*\.\.\.)\s+[a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*\s*\)/m;
const PACKAGE_REGEX = /^[^\S\r\n]*package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+\s*;[^\n]*(?:\n|$)/gm;
const PACKAGE_DETECT_REGEX = /^\s*package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+\s*;/m;
const CLASS_DETECT_REGEX = /\b(?:public\s+)?(?:final\s+|abstract\s+)?class\s+[a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*/;
const JAVA_IMPORT_REGEX = /^\s*import\s+java\./m;
const JAVA_SIGNAL_REGEX = /\bSystem\.out\.|Scanner\s*<|Scanner\s+|BufferedReader\s+|StringTokenizer\s+/;
const CLASS_NAME_REGEX = /class\s+([a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*)/g;
