# Algorithm Java Auto Formatter

백준/삼성 SW Expert Academy 제출 페이지에서 Java 코드 붙여넣기 시 자동으로 포맷을 보정해주는 [Chrome 확장프로그램](https://chromewebstore.google.com/detail/algorithm-java-auto-forma/kmgiifgocdmnncighgpjbdbahbkmanjn)입니다.

🚨 버그를 발견하면 재현 방법(입력 코드, 사이트 URL, 기대 결과/실제 결과)과 함께 Issue로 제보해 주세요.

> 본 확장은 온라인 저지 제출 코드(클래스 + `static main`) 형태를 기준으로 동작합니다.

## 기능
- `package ...;` 선언 자동 제거
- `main`을 포함한 클래스명을 사이트 규칙에 맞게 자동 변경
- 백준: `Main`
- SWEA: `Solution`
- 팝업 토글로 변환 알림(Toast) On/Off

## 지원 사이트
- https://www.acmicpc.net/submit/*
- https://swexpertacademy.com/*

## 사용 방법
1. 지원 사이트의 코드 입력창을 엽니다.
2. Java 코드를 붙여넣습니다.
3. 조건에 맞으면 자동 변환됩니다.
4. 변경이 없으면 원문 그대로 붙여넣습니다.

## 변환 규칙
- Java 코드로 판단될 때만 동작합니다.
- 실제 코드가 변경된 경우에만 붙여넣기를 가로채고 알림을 표시합니다.
- 주석/문자열 내부 패턴은 변환 판단에서 제외합니다.
- 주석/문자열을 제외한 코드에서 `public static void main(...)` 시그니처를 정규식으로 탐지해 이 진입점을 감싸는 실제 실행 클래스만 이름을 변경합니다.

## 작동 원리 (상세)
이 확장은 아래 제출 페이지 URL 패턴에서만 동작합니다.
- `https://www.acmicpc.net/submit/*`
- `https://swexpertacademy.com/*`

### 자바 코드인지 판별하는 방법
1. 붙여넣은 텍스트에서 주석/문자열(`//`, `/* */`, `"..."`, `'...'`)을 먼저 마스킹합니다.
2. 마스킹된 텍스트 기준으로 아래 신호를 검사합니다.
   - `package ...;` 선언이 있으면 Java 코드로 판단
   - 또는 `class` 선언이 있고, 아래 중 하나 이상이 있으면 Java 코드로 판단
     - `main` 시그니처: `main(String[] 변수명)` 또는 `main(String... 변수명)`
     - `import java.`
     - Java 신호 토큰(`System.out`, `Scanner`, `BufferedReader`, `StringTokenizer`)
3. `main` 시그니처는 변수명(`args`) 고정이 아니며, 식별자라면 어떤 이름도 허용합니다.
4. 이 조건을 통과한 경우에만 `package` 제거/클래스명 변경 변환을 실행합니다.

### 변환 동작 흐름
1. `package` 선언이 있는 줄은 통째로 제거하고, 파일 시작부의 불필요한 빈 줄을 정리합니다.
2. `main` 시그니처 위치를 찾고, 중괄호 깊이를 역추적해 실제 실행 클래스를 식별합니다.
3. 사이트 규칙에 맞게 클래스명만 교체합니다.
   - 백준: `public class Main`
   - SWEA: `class Solution`
4. 최종 결과가 원문과 다를 때만 붙여넣기를 가로채 변환본을 삽입합니다.

## 권한
- `storage`: Toast On/Off 설정 저장

## 파일 구조
- `manifest.json`: 확장 설정
- `content/constants.js`: 셀렉터/정규식/환경 상수
- `content/ui.js`: Toast UI
- `content/parser.js`: Java 코드 마스킹 및 main 클래스 추적
- `content/transform.js`: 변환 규칙 및 텍스트 삽입
- `content/handler.js`: paste 이벤트 진입점
- `popup.html`, `popup.js`: 설정 UI 및 저장

## 알려진 제한
- 모든 Java 문법을 완전 파싱하지는 않으며, 일부 특수한 코드 스타일에서는 변환이 제한될 수 있습니다.
