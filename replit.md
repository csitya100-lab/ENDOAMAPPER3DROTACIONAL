# 3D Uterus Visualizer

## Overview

A medical visualization application for mapping and documenting endometriosis lesions using interactive 3D models of the uterus. The system enables healthcare professionals to visualize anatomical structures, place lesion markers with severity classifications, and generate structured clinical reports using AI-powered dictation analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **3D Rendering**: Three.js with OrbitControls and GLTFLoader for medical visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api` prefix
- **AI Integration**: Google Gemini API via Replit AI Integrations for medical dictation analysis

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains both database tables and Zod validation schemas
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions
- **Current Storage**: In-memory storage (`MemStorage`) for development; database provisioning required for production

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas used by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code
- **Component Architecture**: Reusable UI components in `client/src/components/ui/`
- **Page-based Routing**: Pages in `client/src/pages/` map to routes
- **Laudo Module**: Centralized medical report logic at `shared/laudo/`:
  - `types.ts`: LaudoData, ModeloLaudo, AchadosDetectados interfaces
  - `templates.ts`: LAUDO_PADRAO, LAUDO_NORMAL, LAUDO_OBSTETRICO_1T, LAUDO_OBSTETRICO_2T, MODELOS_SISTEMA
  - `utils.ts`: converterNumerosParaDigitos, detectarAchados, formatarLesao, formatarLaudo, validarLaudo, carregarLaudoDoStorage

### Application Pages
1. **Home** (`/`): Main 3D visualization interface with lesion controls
2. **Vistas 2D** (`/vistas-2d`): 2D views editor with Sagittal, Coronal, and Posterior views for precise lesion positioning
3. **Dashboard** (`/dashboard`): Patient exam records overview
4. **Exam Report** (`/report`): Multi-view report generation with lesion details
5. **Ditado IA** (`/ditado-ia`): AI-powered voice dictation to structured medical report
6. **Gerenciar Modelos** (`/modelos`): Template management for report models

### Report Templates Available
1. **Mapeamento de Endometriose**: Standard endometriosis mapping template
2. **US Transvaginal Normal**: Routine gynecological exam template
3. **Obstetrícia 1º Trimestre**: First trimester obstetric assessment
4. **Morfológico 2º Trimestre**: Fetal morphology evaluation
5. **Mapeamento de endometriose 2**: Advanced structured template with MUSA (adenomyosis), IOTA/O-RADS (ovarian lesions), and IDEA (deep endometriosis) systematic evaluation including:
   - Complete anatomical biometry and morphology assessment
   - Compartmental endometriosis mapping (anterior, medial, posterior)
   - Detailed lesion characterization with anatomical classification
   - Risk classification system (APU-1/2/3)
   - Extrapelvic site assessment (kidneys, diaphragm, abdominal wall)

### 2D Views System
- **Projection Functions** (`shared/3d/projections.ts`): 3D<->2D coordinate transformations
  - `project3DToView()`: Converts 3D positions to 2D canvas coordinates for each view type
  - `canvas2DTo3D()`: Converts 2D canvas clicks back to 3D world coordinates
  - Supports: sagittal AVF (anterior view), sagittal RVF (posterior view), coronal (front view), posterior (back view)
- **Canvas2D Component** (`client/src/components/Canvas2D.tsx`): Interactive 2D canvas with dual-layer rendering
  - Layer 1: Lesion markers with anatomical backgrounds
  - Layer 2: Freehand drawing and annotation tools
  - Click to add lesions, drag to move, double-click to edit
  - Drawing tools: Select (lesions), Pen (freehand), Eraser
  - Customizable drawing color and brush size
- **Lesion Store** (`client/src/lib/lesionStore.ts`): Zustand-based global state for lesion synchronization
  - Enables 2D<->3D synchronization across views
- **Drawing Tools Toolbar**: Access in Vistas 2D page header
  - Select tool: Manage lesion markers
  - Pen tool: Freehand drawing with custom color and size (1-20px)
  - Eraser tool: Remove annotations from canvas
  - Line tool: Draw straight lines with customizable thickness and color
  - Circle tool: Draw circle outlines with custom size and color
  - Filled Circle tool: Draw solid circles with custom size and color
  - Text tool: Add text annotations with customizable size and color

### Medical Report Structure
The laudo (medical report) follows a compartmentalized clinical model for endometriosis diagnosis including:
- Header with exam metadata
- Equipment specifications
- Anatomical structures (urethra, bladder, vagina)
- Uterus with biometry and lesion data
- Bilateral ovarian assessment
- Compartmental endometriosis mapping (anterior, lateral, medial, posterior)
- Clinical conclusion

## External Dependencies

### AI Services
- **Google Gemini**: Accessed through Replit AI Integrations for medical dictation parsing
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Used to convert natural language medical dictation into structured JSON report updates

### Database
- **PostgreSQL**: Required for production deployment
  - Environment variable: `DATABASE_URL`
  - Managed via Drizzle Kit migrations (`drizzle-kit push`)

### Key NPM Packages
- `three`: 3D graphics rendering
- `@tanstack/react-query`: Async state management
- `zustand`: Lightweight state management for cross-component synchronization
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod integration
- `@radix-ui/*`: Accessible UI primitives
- `zod`: Runtime type validation
- `express-session` / `connect-pg-simple`: Session management

### Build & Development
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph tags
- esbuild for server bundling with dependency allowlist optimization