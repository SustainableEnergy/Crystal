# ⚡ Cathode Visualizer (양극재 시각화 엔진)

**리튬이온 배터리 양극재의 고화질 결정 구조 3D 시각화 도구**

실시간 렌더링, 인터랙티브 컨트롤, 과학적 정확성을 갖춘 프리미엄 3D 시각화 애플리케이션입니다.

---

## 🎯 주요 기능

### 🔋 지원하는 양극재
- **NCM (LiNiCoMnO₂)** - 층상 산화물 양극재
  - NCM811 (Ni:Co:Mn = 8:1:1) - 기본값
  - NCM622 (Ni:Co:Mn = 6:2:2)
  - NCM111 (Ni:Co:Mn = 1:1:1)
- **LFP (LiFePO₄)** - 올리빈 구조 양극재
- **LMFP (LiMn₀.₃₅Fe₀.₆₅PO₄)** - 올리빈 구조 양극재 (Mn/Fe 고용체)
- **CIF 파일 불러오기** - 사용자 정의 결정 구조 로드

### 🎨 시각화
- **실시간 3D 렌더링** (WebGL 기반)
- **다면체 표시** - 금속-산소 배위 환경
- **단위 격자 반복** - 최대 10×10×10 슈퍼셀 생성
- **자동 회전** - 역동적인 프레젠테이션을 위해 기본 활성화
- **프리미엄 조명** - 스튜디오 품질의 조명 프리셋
- **Li 충방전 애니메이션** - 배터리 충전/방전 과정 시각화 (실시간 토글)

### 📷 내보내기 및 캡처
- **Snapshot** - 고해상도 PNG 스크린샷 저장
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
- **구조 선택**: 상단 중앙 드롭다운 메뉴
  - NCM 선택 시 비율(811/622/111) 서브메뉴 표시
  - 선택한 구조가 즉시 렌더링됨
- **Li Cycle**: 상단 우측 버튼 (Li 충방전 애니메이션 토글)
- **Snapshot**: 상단 우측 버튼
- **공간군 정보**: 좌측 패널 (항상 표시)
- **상세 컨트롤**: 우측 패널 (Unit Cell, 원소 설정 등)
- **Reset View**: 좌측 하단
- **Export 3D**: 좌측 하단 (Reset View 오른쪽)

### 모바일
- **헤더 버튼**:
  - Structure - 양극재 및 비율 선택
  - Li Cycle - 충방전 애니메이션 토글
  - Info ▶ - 공간군 패널 토글
  - Controls - Leva 컨트롤 토글
- **하단 버튼**:
  - Snapshot
  - Reset View

### 키보드 및 마우스
- **마우스 드래그**: 뷰 회전
- **스크롤**: 확대/축소
- **우클릭 드래그**: 카메라 팬
- **더블클릭**: 포커스 리셋
- **스페이스바**: 자동 회전 On/Off

---

## 📊 공간군 정보

### NCM (R-3m, #166)
- **결정계**: 삼방정계/능면체정계 (Trigonal/Rhombohedral)
- **구조**: 층상 α-NaFeO₂ 타입
- **배위**: 팔면체 (MO₆)
- **Ni/Co/Mn 비율**:
  - NCM811: 고용량, 고니켈 (80% Ni) - 가장 높은 에너지 밀도
  - NCM622: 균형잡힌 특성 (60% Ni) - 성능과 안정성 균형
  - NCM111: 안정성 우선 (33.3% Ni) - 가장 안정적
- **권장 뷰**: 측면 보기, ny=2-3으로 층상 구조 관찰

### LFP (Pnma, #62)
- **결정계**: 직방정계 (Orthorhombic)
- **구조**: 올리빈 (Olivine)
- **배위**: 팔면체 MO₆ + 사면체 PO₄
- **특징**: 1차원 리튬 확산 채널, 높은 열안정성

---

## 🛠️ 기술 스택

- **React** - UI 프레임워크
- **Three.js** - 3D 렌더링 엔진
- **@react-three/fiber** - Three.js용 React 렌더러
- **@react-three/drei** - 유용한 헬퍼
- **@react-three/postprocessing** - 시각 효과 (Bloom, Vignette)
- **Leva** - GUI 컨트롤
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구

---

## 🏗️ 프로젝트 구조

```
src/
├── components/
│   ├── scene/
│   │   ├── StructureScene.tsx    # 메인 3D 씬 (이벤트 기반 구조 변경)
│   │   ├── Atoms.tsx              # 원자 렌더링
│   │   ├── Bonds.tsx              # 결합 시각화
│   │   ├── Polyhedra.tsx          # 배위 다면체
│   │   └── Materials.ts           # 재질 정의
│   └── UI/
│       ├── SpaceGroupPanel.tsx    # 공간군 정보 표시
│       ├── StructureSelector.tsx  # 재료 및 NCM 비율 선택기
│       ├── SnapshotButton.tsx     # 스크린샷 캡처
│       └── MobileHeader.tsx       # 모바일 네비게이션
├── core/
│   ├── builders/
│   │   ├── NCMBuilder.ts          # NCM 구조 생성기 (비율별)
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

### NCM 비율에 따른 특성

| 비율   | Ni 함량 | 특징                   | 용도               |
| ------ | ------- | ---------------------- | ------------------ |
| NCM811 | 80%     | 고용량, 낮은 열안정성  | EV 배터리 (장거리) |
| NCM622 | 60%     | 균형잡힌 성능          | 범용 배터리        |
| NCM111 | 33.3%   | 높은 안정성, 낮은 용량 | 산업용 배터리      |

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

2. `StructureScene.tsx`의 구조 생성 로직에 추가

3. `SpaceGroupPanel.tsx`에 공간군 정보 업데이트

4. `StructureSelector.tsx`에 구조 옵션 추가

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

## 🔧 주요 변수 및 수정 가이드

### 1. 원소 색상 및 크기 수정
- **관리 위치**: `src/components/scene/Materials.ts`
- **주요 변수**: 
  - `ELEMENT_COLORS`: 원소별 Hex 색상 코드 정의
  - `ELEMENT_RADII`: 원소별 시각적 반지름 크기
- **팁**: 새로운 원소를 추가하거나 기존 색상을 변경하려면 이 파일을 수정하세요. 변경 내용은 즉시 반영됩니다.

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

## 📝 최신 업데이트 (v1.5.1)

### v1.5.1 - UI 개선 및 Polyhedra 렌더링 최적화
- 🎛️ **Clipping 컨트롤 간소화**:
  - 6개 슬라이더(X/Y/Z Min/Max) → 3개 범위 슬라이더(X/Y/Z)로 통합
  - Leva 범위 타입 지원 활용
  - 더 직관적이고 간결한 UI
- ✨ **Polyhedra 렌더링 개선**:
  - meshStandardMaterial → meshBasicMaterial로 변경
  - 조명의 과도한 영향 제거
  - 일관된 색상 표현
  - 더 깔끔한 시각적 품질

### v1.5.0 - 시각 효과 최적화 및 간소화
- 🎨 **Effect 정리 및 간소화**:
  - Depth Fog 제거 (작은 결정 구조에 불필요)
  - Leva panel의 Effects 섹션 통합 ("Premium AO" + "Beta" → "Effects")
  - Vignette를 선택적으로 변경 (기본값 OFF)
- 💎 **Polyhedra 재질 개선**:
  - FresnelMaterial 제거, Standard Material로 교체
  - 간결하고 유지보수 가능한 코드
  - 투명도 및 렌더링 품질 개선 (opacity: 0.35, roughness: 0.7)
- ✨ **Emissive 렌더링 수정**:
  - Tone Mapping을 ACESFilmic으로 변경
  - Tone Mapping Exposure를 1.2로 조정
  - Emissive 효과가 제대로 보이도록 개선
- 🐛 **Snapshot 기능 개선**:
  - 이벤트 핸들러 의존성 수정
  - 디버그 로그를 개발 환경에서만 출력
- 🧹 **코드 정리**:
  - 미사용 FresnelMaterial 관련 코드 제거
  - 간결성과 유지보수성 향상

### v1.4.1 - 코드 품질 및 타입 안전성 개선
- 🔧 **프로젝트 이름 수정**: package.json의 철자 오류 수정 (crsytal → crystal)
- 💎 **TypeScript 타입 안전성 강화**: 
  - `any` 타입 제거 및 명시적 인터페이스 정의 (`VisualSettings`, `ElementSettings` 등)
  - `@ts-ignore` 주석 제거 및 `FresnelMaterial` 타입 선언 추가
  - `ErrorBoundary`의 `React.ErrorInfo` 타입 사용
- 📐 **하드코딩 값 상수화**:
  - UI 레이아웃 상수 분리 (`UI_LAYOUT`)
  - 기하학적 상수 분리 (`BOND_DISTANCE`, `CAMERA`)
  - 유지보수성 및 가독성 향상
- ⚡ **성능 최적화**:
  - 이벤트 핸들러에 `useCallback` 적용으로 불필요한 리렌더링 방지
  - 메모이제이션 개선
- 🐛 **디버그 코드 정리**: 
  - 개발 환경에서만 console.log 실행 (`import.meta.env.DEV`)
- 🧪 **테스트 인프라 구축**:
  - Vitest 설정 및 첫 테스트 파일 추가
  - `npm test`, `npm run test:ui` 스크립트 지원

### v1.4.0 - Li 충방전 애니메이션 및 코드 정리
- ✨ **Li 충방전 애니메이션**: 배터리 충전/방전 과정을 시각적으로 표현
  - 데스크톱: 상단 우측 "Li Cycle" 버튼으로 토글
  - 모바일: 헤더의 애니메이션 토글 버튼
  - 리튬 이온의 삽입/탈리 과정을 실시간으로 시각화
  - 재료별 동작: NCM/LCO는 층간, LFP/LMFP는 1차원 채널을 따라 이동
- 🧹 **코드 정리**: 미사용 데모 파일 제거 및 프로젝트 구조 개선
- 📚 **문서 개선**: 주요 기능 및 버전 히스토리 업데이트

### v1.3.2 - LMFP 구조 추가
- ✨ **LMFP 구조 지원**: LiMn₀.₃₅Fe₀.₆₅PO₄ 올리빈 구조 추가
  - Fe/Mn 고용체 (65%/35% 비율)
  - LFP와 동일한 Pnma 공간군 사용
  - 확률적 Fe/Mn 치환으로 현실적인 분포 구현

### v1.3.1 - 시각적 깊이감 및 구조 최적화
- ✨ **SSAO (Screen Space Ambient Occlusion)**: 원자 사이의 미세한 그림자를 계산하여 입체감과 덩어리감(Volume) 강화
- ✨ **Bloom (Glow)**: 밝은 영역에 은은한 빛 번짐 효과를 추가하여 에너지 느낌 연출
- ✨ **Depth Fog**: 거리에 따른 안개 효과로 공간감과 깊이감(Depth) 극대화 (밝은 배경과 조화)
- ✨ **Rim Light (Backlight)**: 역광 조명을 추가하여 물체의 실루엣을 강조하고 "떠 있는(Floating)" 느낌 구현
- 🎛️ **Effects 패널**: Leva에서 모든 시각 효과를 실시간으로 On/Off 및 강도 조절 가능
- 📐 **구조 원점(Origin) 조정**: NCM/LCO 구조의 Z축을 -1/6 이동하여 전이금속(Polyhedra) 층이 0, 1/3, 2/3 위치에 오도록 수정
- 🏷️ **원소 범례(Legend)**: 화면 상단에 현재 구조의 원소 종류와 색상 정보를 표시
  - **Adaptive Color**: `mix-blend-mode: difference`를 적용하여 배경색(밝음/어두움)에 따라 글자색 자동 반전
  - **Minimal Design**: 배경색을 제거하고 투명한 디자인 적용
- 💠 **Polyhedra 재질 최적화**: 다면체의 질감을 Matte(무광)하게 변경하여 번들거림을 줄이고 시각적 편안함 제공
- 🔧 **유지보수**: 애플리케이션 타이틀 철자 수정 (Kristal → Crystal Structure)

### v1.3.0 - 시각화 및 UX 대규모 업데이트
- ✅ **LFP/NCM 기본 격자값 최적화**: 
  - LFP: 3x3x6 (기존 4x4x7에서 변경)
  - NCM: 6x6x3 (기존 5x5x3에서 변경)
- ✅ **양방향 Clipping**: X, Y, Z축에 대해 Min/Max 범위를 지정하여 Slicing 가능
- ✅ **정수 단위 격자 조절**: +/- 버튼으로 간편하게 격자 크기 조절
- ✅ **조명 개선**: Environment 조명에 Blur 효과를 추가하여 반사광 완화
- ✅ **Leva 패널 개선**: 평면(Flat) 모드 적용 및 자동 스크롤, 폰트 크기 확대

### v1.2.0 - UI 개선 및 구조 선택 수정
- ✅ **구조 선택 기능 완전 작동**: 이벤트 기반으로 재설계, 실시간 변경 적용
- ✅ **Leva에서 구조 선택 제거**: 별도 UI로 분리, 더 직관적인 조작
- ✅ **UI 레이아웃 충돌 해결**: 
  - 상단 바 우측 여백 조정 (Leva와 겹치지 않음)
  - Leva z-index 조정 (999)
- ✅ **Export 버튼 재배치**: 좌측 하단, Reset View와 동일 레벨
- ✅ **모바일에서 Export 숨김**: 데스크톱 전용 기능선택 추가
- ✅ **NCM 비율 선택 기능 추가**: NCM 선택 시 811/622/111 비율 선택 가능
- ✅ **카메라 프리셋 제거**: 불필요한 카메라 프리셋 UI 제거
- ✅ **이모지 제거**: 모든 UI에서 불필요한 이모지 제거

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

**Q. 구조를 변경했는데 변하지 않아요**
A. v1.2.0에서 완전히 수정되었습니다. 브라우저 콘솔(F12)에서 "Structure change event:" 로그를 확인하세요

**Q. NCM 비율을 어떻게 선택하나요?**
A. 상단 구조 선택 드롭다운에서 "NCM"을 선택하면 비율 서브메뉴가 자동으로 나타납니다

**Q. Leva 패널이 다른 요소와 겹쳐요**
A. v1.2.0에서 레이아웃이 최적화되었습니다. 상단 바가 Leva 패널을 침범하지 않도록 조정되었습니다

---

## 📝 라이선스

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
