# Changelog

이 프로젝트의 주요 변경 사항은 이 파일에 기록합니다.

## [Released]

### Added
- Jest 테스트 환경 추가 (`package.json`, `package-lock.json`, `jest.config.cjs`)
- 변환 로직 회귀 테스트 추가 (`tests/transform.test.js`)
  - `package` 감지/제거 케이스
  - 주석/문자열 제외 케이스
  - `psvm(main)` 탐지 및 클래스명 변경 케이스

### Fixed
- `package` 감지 시 주석/문자열 내부 텍스트를 오탐하던 문제 수정
- `package`가 주석인데 붙여넣기를 하면 다음 `import`가 주석 처리될 수 있던 문제 수정
