# ⚡ Cathode Visualizer (양극재 시각화 엔진)

**리튬이온 배터리 양극재의 고화질 결정 구조 3D 시각화 도구**

실시간 렌더링, 인터랙티브 컨트롤, 과학적 정확성을 갖춘 프리미엄 3D 시각화 애플리케이션입니다.

---

## 🎯 주요 기능

### 🔋 지원하는 양극재
- **NCM (LiNi₀.₈Co₀.₁Mn₀.₁O₂)** - 층상 산화물 양극재
- **LFP (LiFePO₄)** - 올리빈 구조 양극재
- **CIF 파일 불러오기** - 사용자 정의 결정 구조 로드

### 🎨 시각화
- **실시간 3D 렌더링** (WebGL 기반)
- **다면체 표시** - 금속-산소 배위 환경
- **단위 격자 반복** - 최대 10×10×10 슈퍼셀 생성
- **자동 회전** - 역동적인 프레젠테이션을 위해 기본 활성화
- **프리미엄 조명** - 스튜디오 품질의 조명 프리셋

### 📐 카메라 컨트롤
- **4가지 시점 프리셋**:
  - 🎯 Isometric (기본) - 비스듬한 각도
  - ⬆️ Top - 위에서 보기
  - 👁️ Front - 정면 보기
  - ↔️ Side - 측면 보기
- **부드러운 전환** - 카메라 위치 변경 시 애니메이션
- **Reset View 버튼** - 빠른 초기화

### 📷 내보내기 및 캡처
- **스냅샷** - 고해상도 PNG 스크린샷 저장
- **3D 모델 내보내기** - GLB/GLTF 파일 형식으로 내보내기
- **자동 파일명** - 구조 타입과 타임스탬프로 파일명 생성

### 📱 모바일 반응형
- **적응형 UI** - 데스크톱과 모바일에 최적화된 레이아웃
- **접이식 패널** - 공간군 정보 및 컨트롤 패널
- **터치 친화적** - 최소 44px 터치 영역
- **제스처 지원** - 터치로 팬, 줌, 회전

### ⚙️ 고급 컨트롤
- **원소 표시/숨김** - 특정 원소만 선택적으로 표시
- **원자 크기 조절** - 개별 원자 크기 변경
- **커스텀 색상** - 기본 원소 색상 재정의
- **재질 프리셋** - 금속성, 유리, 무광 마감
- **클리핑 평면** - X, Y, Z 축을 따라 구조 절단
- **조명 컨트롤** - 키, 필, 림, 앰비언트 라이트 조절

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18 이상
- npm

### 설치

```bash
# 저장소 클론
git clone https://github.com/SustainableEnergy/Crystal.git
cd Crystal

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 프로덕션 빌드

```bash
npm run build
```

최적화된 빌드가 `dist/` 디렉토리에 생성됩니다.

---

## 🎮 사용 방법

### 데스크톱
- **구조 선택**: 상단 바 드롭다운 메뉴
- **카메라 프리셋**: 우측 상단 컨트롤
- **스냅샷**: 우측 상단 카메라 버튼 (📷)
- **공간군 정보**: 좌측 패널 (항상 표시)
- **상세 컨트롤**: 우측 패널 (Leva 인터페이스)

### 모바일
- **헤더 버튼**:
  - 🔋 Structure - 양극재 선택
  - Info ▶ - 공간군 패널 토글
  - ⚙️ Settings - Leva 컨트롤 토글
- **하단 바**:
  - 📷 스냅샷
  - Reset View
  - 카메라 프리셋 (아이콘 버튼)

### 키보드 및 마우스
- **마우스 드래그**: 뷰 회전
- **스크롤**: 확대/축소
- **우클릭 드래그**: 카메라 팬
- **더블클릭**: 포커스 리셋

---

## 📊 공간군 정보

### NCM (R-3m, #166)
- **결정계**: 삼방정계/능면체정계 (Trigonal/Rhombohedral)
- **구조**: 층상 α-NaFeO₂ 타입
- **배위**: 팔면체 (MO₆)
- **권장 뷰**: 측면 보기, ny=2-3으로 층상 구조 관찰

### LFP (Pnma, #62)
- **결정계**: 직방정계 (Orthorhombic)
- **구조**: 올리빈 (Olivine)
- **배위**: 팔면체 MO₆ + 사면체 PO₄
- **특징**: 1차원 리튬 확산 채널

---

## 🛠️ 기술 스택

- **React** - UI 프레임워크
- **Three.js** - 3D 렌더링 엔진
- **@react-three/fiber** - Three.js용 React 렌더러
- **@react-three/drei** - 유용한 헬퍼
- **@react-three/postprocessing** - 시각 효과 (Bloom, SSAO, Vignette)
- **Leva** - GUI 컨트롤
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구

---

## 🏗️ 프로젝트 구조

```
src/
├── components/
│   ├── scene/
│   │   ├── StructureScene.tsx    # 메인 3D 씬
│   │   ├── Atoms.tsx              # 원자 렌더링
│   │   ├── Bonds.tsx              # 결합 시각화
│   │   ├── Polyhedra.tsx          # 배위 다면체
│   │   └── Materials.ts           # 재질 정의
│   └── UI/
│       ├── SpaceGroupPanel.tsx    # 공간군 정보 표시
│       ├── StructureSelector.tsx  # 재료 선택기
│       ├── CameraPresets.tsx      # 뷰 컨트롤
│       ├── SnapshotButton.tsx     # 스크린샷 캡처
│       └── MobileHeader.tsx       # 모바일 네비게이션
├── core/
│   ├── builders/
│   │   ├── NCMBuilder.ts          # NCM 구조 생성기
│   │   └── LFPBuilder.ts          # LFP 구조 생성기
│   ├── utils/
│   │   ├── CIFParser.ts           # CIF 파일 파서
│   │   └── Exporter.ts            # 3D 모델 내보내기
│   └── types.ts                   # TypeScript 타입 정의
├── hooks/
│   └── useMediaQuery.ts           # 반응형 브레이크포인트
└── App.tsx                        # 메인 애플리케이션
```

---

## 📐 과학적 배경

### 다면체 시각화
- **전이금속** (Ni, Co, Mn, Fe): 산소와 팔면체 배위
- **인**: 산소와 사면체 배위
- **결합 거리**:
  - Metal-O: < 2.4 Å
  - P-O: < 1.9 Å

### 단위 격자 파라미터
결정학적 관례에 따라 정의:
- **a, b, c**: 격자 상수 (Ångström)
- **α, β, γ**: 축간 각도 (도)

---

## 🎨 커스터마이징

### 새로운 재료 추가

1. `src/core/builders/`에 빌더 생성:

```typescript
export const generateNewMaterial = (nx: number, ny: number, nz: number): StructureData => {
  return {
    atoms: [...], // 원자 위치
    unitCell: { a, b, c, alpha, beta, gamma }
  };
};
```

2. `StructureScene.tsx`의 재료 선택에 추가

3. `SpaceGroupPanel.tsx`에 공간군 정보 업데이트

### 커스텀 색상 스키마

`src/components/scene/Materials.ts` 수정:

```typescript
export const ELEMENT_COLORS: { [key: string]: string } = {
  'Li': '#808080',
  'Ni': '#00ff00',
  // 색상 추가...
};
```

---

## 🚢 배포

### Vercel (권장)

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 임포트
3. 푸시 시 자동 배포

현재 배포: https://crystal-sustainableenergy.vercel.app

### 수동 배포

```bash
npm run build
# dist/ 폴더를 호스팅에 업로드
```

---

## � 주요 변수 및 수정 가이드

### 1. 원소 색상 및 크기 수정
- **파일**: `src/components/scene/Materials.ts`
- **변수**: `ELEMENT_COLORS`, `ELEMENT_RADII`

### 2. 결정 구조 파라미터 수정
- **파일**: `src/core/builders/xxxBuilder.ts`
- **변수**: `a`, `c` (격자 상수), `coords` (분율 좌표)

### 3. 결합 생성 기준 수정
- **파일**: `src/core/utils/Connectivity.ts`
- **변수**: `maxDistance` (기본값 2.5 Å)

### 4. 시각적 품질 수정
- **파일**: `src/components/scene/Atoms.tsx`
- **변수**: `sphereMaterialProps` (roughness, metalness)

---

## ❓ 자주 묻는 질문

**Q. 스크립트 실행 오류가 발생해요**
A. PowerShell 보안 설정 때문입니다. 해결 방법:

1. **Command Prompt 사용**: PowerShell 대신 cmd 사용
2. **명령어 앞에 추가**: `cmd /c npm install`
3. **영구 해결** (추천):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

**Q. Leva 컨트롤이 보이지 않아요**
A. z-index 문제일 수 있습니다. 브라우저 새로고침 (Ctrl+Shift+R)

**Q. 구조가 변경되지 않아요**
A. 이벤트 리스너가 제대로 등록되었는지 확인하세요. 개발자 도구 콘솔에서 오류 확인

---

## � 라이선스

MIT License - LICENSE 파일 참조

---

## 🤝 기여

기여는 언제나 환영합니다! Pull Request를 자유롭게 제출해주세요.

---

## 📧 문의

질문이나 제안사항은 GitHub 이슈로 등록해주세요.

---

## 🙏 감사의 말

- 재료 데이터베이스의 결정 구조 데이터
- 훌륭한 3D 도구를 제공하는 Three.js 커뮤니티
- 전문 지식을 제공하는 배터리 연구 커뮤니티

---

**배터리 재료 연구를 위해 ❤️ 로 제작되었습니다**
