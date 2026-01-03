# 3D Uterus Visualizer

## Overview

A medical visualization application for mapping endometriosis lesions using interactive 3D and 2D views. The system enables healthcare professionals to visualize anatomical structures, place lesion markers with severity classifications, and annotate views with drawing tools.

## User Preferences

Preferred communication style: Simple, everyday language.
Menu sidebar: Uses short labels "3D" and "2D" instead of full descriptive names for navigation items.
Minimalist UI: Removed thickness slider, export buttons, and unnecessary features.

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
   - **Exportar 3D**: Generates standalone HTML file with embedded 3D model and lesions for sharing
3. **Vistas 2D** (`/vistas-2d`): Independent 2D views editor with drawing tools for precise lesion annotation
4. **Preview Report** (`/preview-report`): Prévia do relatório com imagens capturadas, observações e exportação PDF
5. **Relatório Público** (`/relatorio/:id`): Public report page for doctors to view via unique link
   - Header: patient name, exam date, patient ID
   - Left column (60%): Interactive 3D model with lesions
   - Right column (40%): 2D views (sagittal, coronal, posterior) + exam photo gallery
   - Footer: Lesion summary with severity colors (Superficial=Rosa, Moderada=Laranja, Profunda=Amarelo)

### Critical Architecture Rules
- **NEVER modify**: Home.tsx, Uterus3D.tsx, or lesionStore.ts - 3D model sync must remain intact
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
- **Lesion Store** (`client/src/lib/lesionStore.ts`): Zustand-based global state for 3D lesion synchronization only
- **Drawing Tools**:
  - Select tool: Manage lesion markers
  - Pen tool: Freehand drawing with custom color and size (1-20px)
  - Eraser tool: Remove annotations from canvas
  - Line tool: Draw straight lines with customizable thickness and color
  - Circle tool: Draw circle outlines with custom size and color
  - Filled Circle tool: Draw solid circles with custom size and color
  - Text tool: Add text annotations with customizable size and color
- **Focus System**: Checkbox selection amplifies 2D view to 70% screen (col-span-9), thumbnails in sidebar (col-span-3, h-24)

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
