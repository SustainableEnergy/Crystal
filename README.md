# 🔋 Cathode Visualizer (양극재 3D 시각화 엔진)

**Cathode Visualizer**는 배터리 양극재(LCO, NCM, LFP)의 결정 구조를 정확하고 아름답게 시각화하는 고성능 웹 애플리케이션입니다. 
이 문서는 프로젝트의 **파일 구조, 작동 원리, 그리고 주요 수정 포인트**를 상세히 설명하여, 개발자나 연구자가 코드를 쉽게 이해하고 확장할 수 있도록 돕습니다.

---

## 📂 프로젝트 구조 (Project Hierarchy)

이 프로젝트는 **데이터 생성(Core)**과 **시각화(Scene)**가 철저히 분리된 구조를 따릅니다.

```text
src/
├── App.tsx                     # [진입점] 3D 캔버스, 조명, 포스트 프로세싱 설정
├── index.css                   # 전역 스타일 (배경색, 폰트 등)
│
├── components/                 # [시각화] React 컴포넌트
│   └── scene/
│       ├── StructureScene.tsx  # [핵심] UI 컨트롤(Leva)과 데이터 생성을 연결하는 총괄 매니저
│       ├── Atoms.tsx           # 원자 렌더러 (InstancedMesh 사용, 성능 최적화)
│       ├── Polyhedra.tsx       # 다면체 렌더러 (ConvexHull 계산)
│       ├── Bonds.tsx           # 결합선 렌더러
│       └── Materials.ts        # [설정] 원소별 색상, 반지름 정의
│
└── core/                       # [로직] 순수 수학/결정학 로직
    ├── types.ts                # TypeScript 타입 정의 (Atom, StructureData 등)
    ├── builders/               # 결정 구조 생성 알고리즘
    │   ├── LCOBuilder.ts       # LiCoO2 (층상 구조) 생성 로직
    │   ├── NCMBuilder.ts       # NCM (혼합 층상) 생성 로직
    │   └── LFPBuilder.ts       # LiFePO4 (올리빈/Pnma) 생성 로직
    └── utils/
        ├── Connectivity.ts     # 원자 간 결합 계산 (거리 기반)
        └── Exporter.ts         # .glb 파일 내보내기 기능
```

---

## ⚙️ 작동 원리 (Architecture)

데이터의 흐름은 다음과 같이 **단방향**으로 이루어집니다.

1.  **사용자 입력**: `StructureScene.tsx`에 있는 컨트롤 패널(Leva)에서 사용자가 구조(LCO/NCM/LFP)와 확장 크기(nx, ny, nz)를 선택합니다.
2.  **구조 생성 (Builder)**: 선택된 옵션에 따라 `core/builders/` 폴더의 빌더 함수가 실행됩니다.
    *   예: `nx=2`라면 단위 격자를 2배로 복제하고, 각 원자의 **XYZ 좌표(Cartesian)**를 계산하여 수천 개의 `Atom` 배열을 반환합니다.
3.  **데이터 전달**: 생성된 `Atoms` 데이터는 `StructureScene`을 통해 시각화 컴포넌트들(`Atoms`, `Polyhedra`, `Bonds`)로 전달됩니다.
4.  **렌더링 (Rendering)**:
    *   **Atoms**: `InstancedMesh`를 사용하여 수만 개의 원자가 있어도 GPU 부하 없이 부드럽게 그려냅니다.
    *   **Polyhedra**: 전이금속(Co, Fe 등) 주변의 산소(O)들을 찾아 자동으로 다면체(Convex Hull)를 구성합니다.
5.  **후처리 (Post-Processing)**: `App.tsx`에서 최종적인 렌더링 결과물에 **Bloom(빛 번짐)**과 **Vignette(가장자리 어두움)** 효과를 입혀 프리미엄 룩을 완성합니다.

---

## �️ 주요 변수 및 수정 가이드 (Modifiable Variables)

코드를 수정하고 싶을 때 어디를 봐야 할지 정리했습니다.

### 1. 원소 색상 및 크기 수정
*   **파일**: `src/components/scene/Materials.ts`
*   **변수**: `ELEMENT_COLORS`, `ELEMENT_RADII`
*   **설명**: 여기서 Li, O, Co 등의 색상(Hex Code)이나 반지름을 변경하면 즉시 반영됩니다.
    ```typescript
    export const ELEMENT_COLORS = {
      Li: '#7A52CC', // 보라색
      O: '#FF4D4D',  // 빨간색
      // ...
    };
    ```

### 2. 결정 구조 파라미터 수정 (격자 상수 등)
*   **파일**: `src/core/builders/xxxBuilder.ts` (예: LCOBuilder.ts)
*   **변수**: `a`, `c` (Lattice Parameters), `coords` (Fractional Coordinates)
*   **설명**: 논문 데이터를 바탕으로 격자 상수를 더 정밀하게 수정하고 싶다면 여기서 `const a = 2.816;` 같은 값을 고치세요.

### 3. 결합(Bond) 생성 기준 수정
*   **파일**: `src/core/utils/Connectivity.ts`
*   **변수**: `maxDistance`
*   **설명**: 원자 사이의 거리가 얼마일 때 선을 그을지 결정합니다. 기본값 `2.5` (Å)를 조절하여 결합을 더 많이 생기게 하거나 줄일 수 있습니다.

### 4. 시각적 품질(조명, 광택) 수정
*   **파일**: `src/components/scene/Atoms.tsx`
*   **변수**: `sphereMaterialProps`
*   **설명**: 원자의 질감을 결정합니다. `roughness`(거칠기)를 낮추면 더 반짝이고, `metalness`(금속성)를 높이면 더 금속 같아집니다.

---

## 🚀 실행 방법 (Quick Start)

**1. 설치 (최초 1회)**
필요한 라이브러리들을 다운로드합니다. 터미널에 입력하세요.
```bash
npm install
```

**2. 실행**
개발 서버를 시작합니다.
```bash
npm run dev
```

**3. 접속**
터미널에 표시된 주소(예: `http://localhost:5173`)를 **Ctrl + 클릭**하여 브라우저를 엽니다.

---

## ❓ 자주 묻는 질문 (Troubleshooting)

**Q. `npm : 이 시스템에서 스크립트를 실행할 수 없으므로...` 라는 오류가 떠요!**
A. 윈도우 PowerShell의 보안 설정 때문입니다. 다음 중 하나로 해결하세요.

1.  **명령 프롬프트(cmd) 사용**: PowerShell 대신 `Command Prompt`를 열어서 실행하면 해결됩니다.
2.  **명령어 변경**: 명령어 앞에 `cmd /c`를 붙여보세요.
    ```bash
    cmd /c npm install
    cmd /c npm run dev
    ```

3.  **영구적으로 해결하기 (추천)**: VS Code 터미널에서 아래 명령어를 한 번만 실행하세요.
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
    (실행 후 `Y`를 입력하여 동의하면, 앞으로는 그냥 `npm install`만 쳐도 됩니다.)
