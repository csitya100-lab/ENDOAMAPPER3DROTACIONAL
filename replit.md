# 3D Uterus Visualizer

## Overview

A medical visualization application for mapping endometriosis lesions using interactive 3D and 2D views. The system enables healthcare professionals to visualize anatomical structures, place lesion markers with severity classifications, and annotate views with drawing tools.

## User Preferences

Preferred communication style: Simple, everyday language (Portuguese).
Menu sidebar: Uses short labels "3D" and "2D" instead of full descriptive names for navigation items.
Minimalist UI: Removed thickness slider, export buttons, and unnecessary features.

## Recent Changes (Feb 2026 - UI/UX Improvements)

### Toast Notification System
- Replaced all `alert()` calls with sonner toast notifications (success, warning, error variants)
- Added undo functionality for clearing lesions (5-second toast with "Desfazer" button)
- Sonner Toaster component fixed to use app's own themeStore instead of next-themes

### Sidebar Navigation Enhancements
- Flow progress indicator (3D → 2D → Relatório) with visual step tracker
- Badge with lesion count on the 3D nav button
- Accessibility improvements: aria-label, aria-current, focus-visible rings

### Toolbar 3D Reorganization
- Navigation/Marking mode toggle (Navegar/Marcar) to prevent accidental lesion creation
- Buttons grouped into categories with visual separators (Mode | Severity | Captures | Export | Clear)
- interactionMode prop passed to Uterus3D component

### Anatomy Panel
- Elements grouped by category (Órgãos Reprodutivos, Ligamentos, Estruturas Adjacentes)
- Category icons (Heart, Workflow, Shield) from lucide-react
- Improved hover/active states and show/hide buttons

### Landing Page
- CTA "Começar Agora" navigates to /3d (was /vistas-2d)
- CSS animations (fadeInUp) on feature cards with staggered delays
- Subtitle badge "Ferramenta Médica Profissional" above heading
- Heading size increased to text-5xl

### 2D Tools
- Active tool highlighting with pink accent (bg-pink-500/20 text-pink-500 ring-1)
- Pen size/color preview indicator

### Report Drag-and-Drop
- Improved visual feedback with directional border indicators
- Better grip handle styling with pink hover
- Enhanced instruction text with icon

### Gemini AI Integration
- POST /api/generate-findings endpoint using Gemini 2.5 Flash (OpenAI-compatible)
- Generates medical report "Achados" section from lesion data
- UI button in PreviewReport with loading state and purple-themed display
- Uses Replit AI Integrations (no API key needed)

### Dark Mode Consistency
- Full dark mode support in Home/3D view (header, sidebar, controls, anatomy panel)
- Dark mode in AppLayout
- Dark mode in PreviewReport
- All pages now support consistent dark/light theme switching

### Page Transitions & Lazy Loading
- React.lazy() + Suspense for all page routes
- PageTransition component with fade + slide animations (150ms exit, 200ms enter)
- PageLoader fallback component with spinner

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, Zustand for 3D lesion synchronization, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **3D Rendering**: Three.js with OrbitControls and GLTFLoader for medical visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: Minimal backend - primarily serves static files

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect (for future user management)
- **Schema Location**: `shared/schema.ts` contains user table schema
- **Current Storage**: In-memory storage (`MemStorage`) for development

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas used by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code
- **Component Architecture**: Reusable UI components in `client/src/components/ui/`
- **Page-based Routing**: Pages in `client/src/pages/` map to routes

### Application Pages
1. **Landing** (`/`): Página inicial com instruções de uso e botões de navegação para as seções 3D, 2D e Relatório
2. **Home/3D** (`/3d`): Main 3D visualization interface with lesion controls - synchronized across all 4 view perspectives
   - **Capturar 3D**: Captures current 3D perspective view at any angle - multiple captures allowed (stored in draftImages3D array)
   - **Per-View Capture Buttons**: Camera buttons on Sagittal (SIDE), Coronal (FRONT), and Posterior (BACK) views capture directly to draftImages2D
   - **Exportar 3D**: Generates standalone HTML file with embedded 3D model and lesions for sharing
3. **Vistas 2D** (`/vistas-2d`): Independent 2D views editor with drawing tools for precise lesion annotation
4. **Preview Report** (`/preview-report`): Prévia do relatório com imagens capturadas, observações e exportação PDF
5. **Relatório Público** (`/relatorio/:id`): Public report page for doctors to view via unique link
   - Header: patient name, exam date, patient ID
   - Left column (60%): Interactive 3D model with lesions
   - Right column (40%): 2D views (sagittal, coronal, posterior) + 3D captures gallery
   - Footer: Lesion summary with severity colors (Superficial=Rosa, Profunda=Amarelo)

### 3D Module Architecture (Feb 2026 Refactor)
- **Shared Modules** (extracted from Uterus3D.tsx ~1716→~1207 lines):
  - `client/src/lib/modelLoader.ts`: IndexedDB caching, device detection (isIOS/isMobile), model loading with progress
  - `client/src/lib/anatomyCreator.ts`: Programmatic anatomy structures (uterosacral ligaments, ureters, round ligaments, fallopian tubes with fimbriae)
  - `client/src/lib/meshAnalyzer.ts`: GLB model processing, mesh hiding (ligaments), material application, anatomy classification
- **PublicReport.tsx**: Uses shared modules (processGLBModel + createProgrammaticAnatomy) for consistent 3D rendering
- **Device Detection**: Automatic detection of iOS and mobile devices
- **WebGL Optimizations for Mobile**:
  - Reduced pixel ratio (max 2x on iOS)
  - Shadows disabled on mobile devices
  - MeshStandardMaterial instead of MeshPhysicalMaterial on mobile
  - Clearcoat effects disabled on iOS
  - Low-power WebGL preference on iOS
- **Loading UX**:
  - Progress indicator with percentage during model load
  - 15-second timeout with fallback sphere model
  - Error overlay with retry button
  - Fallback notice when simplified mode active
- **IndexedDB Caching**:
  - Model cached in IndexedDB after first load
  - Faster subsequent loads from cache
  - Graceful degradation if cache unavailable
- **Lesion Rendering Fix**:
  - `updateAllMarkers()` called after model loads to render pre-existing lesions
  - Fixes issue where lesions loaded from database wouldn't appear in CaseViewer

### HTML Export System
- **ES Modules via CDN**: Uses unpkg CDN for Three.js (v0.160.0)
- **Import Map**: Configured in exported HTML for browser module resolution
- **Self-contained**: Embedded base64 model data + lesion data in standalone HTML file

### 3D Interaction System (Jan 4, 2026)
- **Mouse Button Rules**:
  - **Left Click (button 0)**: Lesion interaction (select, create, drag)
  - **Right Click (button 2)**: Camera orbit (3D view) OR lesion insertion (2D views)
- **View-Specific Behavior**:
  - **3D Perspective (viewIdx 0)**: Left click creates/selects lesions, right click orbits camera
  - **2D Orthographic (viewIdx 1-3)**: Right click inserts lesions, left click selects/drags existing markers
- **Drag State**: `dragStateRef.current.isDragging` controls lesion movement
  - Only true when: left button pressed, marker detected, in any view
  - Camera controls disabled during drag (`views[viewIdx].controls.enabled = false`)
- **Hit-Test**: `detectLesionMarker()` returns lesionId or null (no fallback to first lesion)
- **Double-Click**: Deletes lesion in any view

### Critical Architecture Rules
- **Vistas2D is INDEPENDENT**: No lesion sync between 2D views (only within 3D model)
- Canvas2D has two layers: main canvas (background + lesions) and drawingCanvas (user drawings overlay)

### 2D Views System
- **Projection Functions** (`shared/3d/projections.ts`): 3D<->2D coordinate transformations
  - `project3DToView()`: Converts 3D positions to 2D canvas coordinates for each view type
  - `canvas2DTo3D()`: Converts 2D canvas clicks back to 3D world coordinates
  - Supports: sagittal AVF (anterior view), sagittal RVF (posterior view), coronal (front view), posterior (back view)
- **Canvas2D Component** (`client/src/components/Canvas2D.tsx`): Interactive 2D canvas with dual-layer rendering
  - Layer 1: Lesion markers with anatomical backgrounds
  - Layer 2: Freehand drawing and annotation tools
  - Drawing preservation: Before resizing drawingCanvas, capture ImageData, resize only if dimensions changed, restore ImageData
- **Lesion Store** (`client/src/lib/lesionStore.ts`): Zustand-based global state for 3D lesion synchronization with sessionStorage persistence
- **Report Store** (`client/src/lib/reportStore.ts`): Zustand store for report images with sessionStorage persistence
- **Session Persistence**: Both stores use `zustand/middleware/persist` with sessionStorage, allowing data to survive page navigation (3D ↔ 2D ↔ Report)
- **Individual View Capture**: Each 2D view has a camera button to capture and add to report immediately
- **Drawing Tools**:
  - Select tool: Manage lesion markers
  - Pen tool: Freehand drawing with custom color and size (1-20px)
  - Eraser tool: Remove annotations from canvas
  - Line tool: Draw straight lines with customizable thickness and color
  - Circle tool: Draw circle outlines with custom size and color
  - Filled Circle tool: Draw solid circles with custom size and color
  - Text tool: Add text annotations with customizable size and color
- **Focus System**: Checkbox selection amplifies 2D view to 70% screen (col-span-9), thumbnails in sidebar (col-span-3, h-24)

## Supabase Configuration

### Required Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Schema
Create the `cases` table in Supabase SQL Editor:
```sql
CREATE TABLE cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  lesions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies
After creating the table, enable RLS and add these policies for secure public sharing:

```sql
-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (create new cases)
CREATE POLICY "Allow anonymous insert" ON cases
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous select (view shared reports)
CREATE POLICY "Allow anonymous select" ON cases
FOR SELECT TO anon
USING (true);

-- UPDATE and DELETE are blocked by default (no policy = denied)
```

This configuration allows:
- ✅ Anyone can create cases and share links
- ✅ Anyone can view shared reports via link
- ❌ No one can modify existing cases
- ❌ No one can delete cases

## External Dependencies

### Key NPM Packages
- `three`: 3D graphics rendering
- `@tanstack/react-query`: Async state management
- `zustand`: Lightweight state management for 3D lesion synchronization
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod integration
- `@radix-ui/*`: Accessible UI primitives
- `zod`: Runtime type validation

### Build & Development
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph tags
- esbuild for server bundling with dependency allowlist optimization

## AI Medical Profile (Base de Conhecimento)

Arquivo de configuração: `shared/knowledge/ai-medical-profile.json`

Perfil de IA médica especialista em ultrassonografia ginecológica e obstétrica com as seguintes características:

- **Especialidades**: Mapeamento de endometriose profunda, medicina fetal, interpretação de laudos
- **Abordagem**: Cientificamente embasada e humanizada
- **Tom**: Calmo, empático, técnico e didático
- **Fontes**: Diretrizes IDEA, ISUOG, FMF e publicações revisadas por pares
- **Outputs**: Interpretações ultrassonográficas, modelos de laudo, explicações de achados, recomendações de seguimento
- **Valores éticos**: Empatia, clareza, respeito, ética médica, sigilo
