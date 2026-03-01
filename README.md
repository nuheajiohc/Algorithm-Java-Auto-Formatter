# Algorithm Java Auto Formatter

백준/삼성 SW Expert Academy 제출 페이지에서 Java 코드 붙여넣기 시 자동으로 포맷을 보정해주는 Chrome 확장입니다.

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
