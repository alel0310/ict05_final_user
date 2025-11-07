# 웹뷰앱 적용 작업 목록 (재수정 3 - 초기화 후 재설정)

- [x] Android 및 Capacitor 설정 초기화
    - [x] `front-end/android` 디렉터리 삭제
    - [x] `package.json`에서 Capacitor 의존성 제거
    - [x] `npm install` 실행 (의존성 정리)
- [x] Capacitor 재설정
    - [x] `package.json`에 호환되는 Capacitor 버전 (`^6.0.0`) 추가
    - [x] `npm install` 실행 (Capacitor 설치)
    - [x] `npx cap init` 실행 (Capacitor 설정 파일 생성)
    - [x] `npx cap add android` 실행 (Android 프로젝트 재생성)
- [x] Android 프로젝트 설정 수정
    - [x] `capacitor.config.ts`에 `server` 설정 추가
    - [x] `android/build.gradle`에서 AGP 버전을 `8.4.2`로 수정
    - [x] `android/variables.gradle`에서 `compileSdkVersion`을 `34`로, `androidxCoreVersion`을 `1.12.0`으로 수정
    - [x] `android/app/build.gradle`에서 `rootProject.ext.` 사용하도록 수정
    - [x] `android/gradle/wrapper/gradle-wrapper.properties`에서 Gradle 버전을 `8.6`으로 업그레이드
    - [x] 안드로이드 스튜디오에서 Gradle JVM을 19 이하 버전으로 변경
- [x] 최종 빌드 및 기능 확인
    - [x] `SecurityConfig.java`에서 보안 규칙 순서 조정 및 명확화
    - [x] 401 오류 디버깅: 임시로 모든 요청 허용하여 문제 원인 분리
    - [x] 404 오류 디버깅: `WebController`의 경로 매핑 수정
    - [x] 404 오류 디버깅: `WebController`가 `index.html` 내용을 직접 반환하도록 수정
    - [x] 404 오류 디버깅: `vite.config.ts`에 `base: '/user/'` 추가 (빌드 시에만 적용)
    - [x] `main.tsx`에 `BrowserRouter basename` 조건부 설정
- [x] 디버깅 코드 원복 및 최종 검증
    - [x] `WebController.java`를 `forward:/index.html` 방식으로 원복
    - [x] `SecurityConfig.java`에서 임시 `permitAll("/**")` 규칙 제거
    - [x] 최종 빌드 및 웹뷰 앱 기능 확인
- [x] 웹뷰 앱 기능 정상화를 위한 통합 작업 (2025-11-07 15:00:00)
    - [x] **1단계: React Router 경로 매칭 수정** (2025-11-07 15:00:00)
        - [x] `front-end/src/main.tsx` 파일에서 `BrowserRouter`의 `basename={basename}` 속성 제거 (2025-11-07 15:00:00)
    - [x] **2단계: JWTFilter 수정** (2025-11-07 15:00:00)
        - [x] `src/main/java/com/boot/ict05_final_user/config/security/filter/JWTFilter.java` 파일에 공개 경로에 대한 JWT 검사 건너뛰기 로직 추가 (2025-11-07 15:00:00)
    - [x] **3단계: 재빌드 및 테스트** (2025-11-07 15:00:00)
        - [x] `front-end` 디렉터리에서 `npm run android-build` 실행 (2025-11-07 15:00:00)
        - [x] `front-end/build` 내용을 백엔드 `src/main/resources/static`으로 복사 (2025-11-07 15:00:00)
        - [x] 백엔드 애플리케이션 재시작 (2025-11-07 15:00:00)
        - [x] `front-end` 디렉터리에서 `npx cap sync android` 및 `npx cap open android` 실행
        - [x] 웹뷰 앱에서 로그인/회원가입 기능 테스트 및 백엔드 콘솔의 `[JWTFilter]` 로그 확인

- [x] **웹뷰 하얀 화면 문제 진단 및 해결 (2025-11-07 15:00:00)**
    - [x] **1단계: Capacitor 설정 점검** (2025-11-07 15:00:00)
        - [x] `front-end/capacitor.config.ts` 파일 내용 확인 및 `server` 설정 검토 (2025-11-07 15:00:00)
        - [x] `front-end/package.json`의 `scripts` 섹션에서 `android-build` 스크립트 확인 (2025-11-07 15:00:00)
    - [x] **2단계: 백엔드 설정 점검** (2025-11-07 15:00:00)
        - [x] `src/main/resources/application.properties` (또는 `application.yml`) 파일 내용 확인 (2025-11-07 15:00:00)
        - [x] `src/main/java/com/boot/ict05_final_user/config/security/config/SecurityConfig.java` 파일 내용 재확인 (특히 정적 리소스 및 SPA 라우팅 관련 설정) (2025-11-07 15:00:00)
        - [x] `src/main/java/com/boot/ict05_final_user/config/security/filter/JWTFilter.java` 파일 내용 재확인 (공개 경로 처리 로직) (2025-11-07 15:00:00)
            - [x] **수정 필요:** `JWTFilter.java`의 공개 경로 조건에 `request.getContextPath()`를 활용하여 `/user` 컨텍스트 경로를 동적으로 포함하도록 수정. (2025-11-07 15:00:00)
            - [x] **수정 필요:** `JWTUtil.java`의 `accessTokenExpiresIn` 주석과 실제 값 불일치 (50초 vs 1시간). 1시간으로 수정 필요.
    - [x] `src/main/java/com/boot/ict05_final_user/config/security/jwt/JWTUtil.java` 파일 내용 확인 (토큰 유효성 검사 로직) (2025-11-07 15:00:00)
    - [x] **3단계: 프론트엔드 환경 설정 점검** (2025-11-07 15:00:00)
        - [x] `front-end/.env` 및 `front-end/.env.android` 파일 내용 확인 (API_URL 등) (2025-11-07 15:00:00)
        - [x] `front-end/vite.config.ts` 파일 내용 확인 (프록시 설정, 빌드 경로 등) (2025-11-07 15:00:00)
            - [x] **수정 필요:** `front-end/src/main.tsx`의 `BrowserRouter` `basename` 복원. (2025-11-07 15:00:00)
            - [x] **수정 필요:** `front-end/vite.config.ts`의 `base` 경로 설정 조건 강화 (`android` 모드일 때 `base: '/user/'`가 확실히 적용되도록 수정). (2025-11-07 15:00:00)
            - [x] **수정 필요:** `front-end/index.html` 파일에서 `vite.svg` 참조 제거. (2025-11-07 15:00:00)
    - [x] **4단계: Android 프로젝트 설정 점검** (2025-11-07 15:00:00)
        - [x] `front-end/android/app/src/main/AndroidManifest.xml` 파일 내용 확인 (인터넷 권한, 웹뷰 설정) (2025-11-07 15:00:00)
        - [x] `front-end/android/app/build.gradle` 파일 내용 확인 (dependencies, defaultConfig) (2025-11-07 15:00:00)
    - [x] **5단계: 로그 확인 및 디버깅** (2025-11-07 15:00:00)
        - [x] Android Studio Logcat에서 웹뷰 관련 에러 로그 확인 (2025-11-07 15:00:00)
        - [x] 백엔드 콘솔에서 요청 처리 및 에러 로그 확인 (2025-11-07 15:00:00)
        - [x] 웹뷰에서 개발자 도구 활성화 가능 여부 확인 (Capacitor Dev Tools) (2025-11-07 15:00:00)
    - [x] **6단계: 문제 해결 및 재테스트**
        - [x] 발견된 문제점에 따라 수정 후, `npm run android-build`, `cp`, 백엔드 재시작, `npx cap sync android`, `npx cap open android` 재실행 및 웹뷰 앱 확인

# 프로젝트 구조 분석 계획

프로젝트의 전체 구조와 흐름을 파악하기 위해 아래 순서대로 파일을 읽고 분석합니다.

### 1단계: 프로젝트 설정 및 환경 분석
- **목표:** 프로젝트의 빌드 설정, 의존성, 주요 환경 구성 파악
- **대상 파일:**
    - `/build.gradle`
    - `/settings.gradle`
    - `/src/main/resources/application.properties`
    - `/front-end/package.json`
    - `/front-end/vite.config.ts`
    - `/front-end/capacitor.config.ts`
    - `/front-end/android/build.gradle`

### 2단계: 백엔드 로직 분석 (Spring Boot)
- **목표:** API 엔드포인트, 비즈니스 로직, 데이터베이스 연동, 보안 설정 파악
- **대상 파일:**
    - `src/main/java/com/boot/ict05_final_user/controller/**/*.java`
    - `src/main/java/com/boot/ict05_final_user/service/**/*.java`
    - `src/main/java/com/boot/ict05_final_user/repository/**/*.java`
    - `src/main/java/com/boot/ict05_final_user/domain/**/*.java`
    - `src/main/java/com/boot/ict05_final_user/config/**/*.java`

### 3단계: 프론트엔드 로직 분석 (React)
- **목표:** UI 컴포넌트 구조, 라우팅, 상태 관리, API 연동 방식 파악
- **대상 파일:**
    - `front-end/src/main.tsx`
    - `front-end/src/App.tsx`
    - `front-end/src/components/**/*.tsx`
    - `front-end/src/pages/**/*.jsx`
    - `front-end/src/lib/**/*.ts`

### 4단계: 최종 빌드 및 정적 리소스 확인
- **목표:** 프론트엔드 빌드 결과물과 백엔드의 정적 리소스 제공 방식 확인
- **대상 파일:**
    - `front-end/index.html`
    - `src/main/resources/static/index.html`