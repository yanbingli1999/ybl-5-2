import { create } from 'zustand';
import type {
  Material,
  GridConfig,
  BoundaryConditions,
  HeatSource,
  ExperimentConfig,
  TemperatureSnapshot,
  ExperimentResult,
  SimulationMode,
  ExperimentTemplate,
} from '@shared/types';

interface SimulationState {
  mode: SimulationMode;
  currentStep: number;
  currentTemperature: number[][];
  temperatureHistory: number[][][];
  
  grid: GridConfig;
  boundaryConditions: BoundaryConditions;
  materialId: string;
  materials: Material[];
  diffusionCoefficient: number;
  initialHeatSources: HeatSource[];
  totalSteps: number;
  timeStep: number;
  playbackSpeed: number;
  minTemp: number;
  maxTemp: number;
  brushSize: number;
  brushTemperature: number;
  drawMode: 'heat' | 'erase' | 'none';
  
  snapshots: TemperatureSnapshot[];
  experiments: ExperimentConfig[];
  favorites: ExperimentResult[];
  templates: ExperimentTemplate[];
  
  currentExperimentId: string | null;
  hoveredCell: { x: number; y: number } | null;
  showTemplateLibrary: boolean;
  showSaveTemplateModal: boolean;
  
  setMode: (mode: SimulationMode) => void;
  setCurrentStep: (step: number) => void;
  setCurrentTemperature: (temp: number[][]) => void;
  addTemperatureToHistory: (temp: number[][]) => void;
  clearHistory: () => void;
  
  setGrid: (grid: GridConfig) => void;
  setBoundaryConditions: (bc: BoundaryConditions) => void;
  setMaterialId: (id: string) => void;
  setMaterials: (materials: Material[]) => void;
  setDiffusionCoefficient: (alpha: number) => void;
  setInitialHeatSources: (sources: HeatSource[]) => void;
  addHeatSource: (source: HeatSource) => void;
  removeHeatSource: (index: number) => void;
  clearHeatSources: () => void;
  setTotalSteps: (steps: number) => void;
  setTimeStep: (dt: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setBrushSize: (size: number) => void;
  setBrushTemperature: (temp: number) => void;
  setDrawMode: (mode: 'heat' | 'erase' | 'none') => void;
  setTempRange: (min: number, max: number) => void;
  
  setSnapshots: (snapshots: TemperatureSnapshot[]) => void;
  addSnapshot: (snapshot: TemperatureSnapshot) => void;
  removeSnapshot: (id: string) => void;
  setExperiments: (experiments: ExperimentConfig[]) => void;
  setFavorites: (favorites: ExperimentResult[]) => void;
  setTemplates: (templates: ExperimentTemplate[]) => void;
  addTemplate: (template: ExperimentTemplate) => void;
  updateTemplate: (template: ExperimentTemplate) => void;
  removeTemplate: (id: string) => void;
  setCurrentExperimentId: (id: string | null) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  setShowTemplateLibrary: (show: boolean) => void;
  setShowSaveTemplateModal: (show: boolean) => void;
  
  reset: () => void;
}

const DEFAULT_GRID: GridConfig = {
  width: 50,
  height: 50,
  cellSize: 12,
};

const DEFAULT_BC: BoundaryConditions = {
  top: 25,
  bottom: 25,
  left: 25,
  right: 25,
  type: 'dirichlet',
};

function createEmptyTemperature(grid: GridConfig): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < grid.height; y++) {
    data[y] = new Array(grid.width).fill(25);
  }
  return data;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'idle',
  currentStep: 0,
  currentTemperature: createEmptyTemperature(DEFAULT_GRID),
  temperatureHistory: [],
  
  grid: DEFAULT_GRID,
  boundaryConditions: DEFAULT_BC,
  materialId: 'copper',
  materials: [],
  diffusionCoefficient: 117e-6,
  initialHeatSources: [],
  totalSteps: 500,
  timeStep: 0.1,
  playbackSpeed: 30,
  minTemp: 0,
  maxTemp: 100,
  brushSize: 2,
  brushTemperature: 100,
  drawMode: 'heat',
  
  snapshots: [],
  experiments: [],
  favorites: [],
  templates: [],
  
  currentExperimentId: null,
  hoveredCell: null,
  showTemplateLibrary: false,
  showSaveTemplateModal: false,
  
  setMode: (mode) => set({ mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentTemperature: (temp) => set({ currentTemperature: temp }),
  addTemperatureToHistory: (temp) =>
    set((state) => ({
      temperatureHistory: [...state.temperatureHistory, temp],
    })),
  clearHistory: () => set({ temperatureHistory: [], currentStep: 0 }),
  
  setGrid: (grid) =>
    set({
      grid,
      currentTemperature: createEmptyTemperature(grid),
      temperatureHistory: [],
      currentStep: 0,
    }),
  setBoundaryConditions: (bc) => set({ boundaryConditions: bc }),
  setMaterialId: (id) => {
    const material = get().materials.find(m => m.id === id);
    if (material) {
      set({
        materialId: id,
        diffusionCoefficient: material.diffusionCoefficient,
      });
    }
  },
  setMaterials: (materials) => set({ materials }),
  setDiffusionCoefficient: (alpha) => set({ diffusionCoefficient: alpha }),
  setInitialHeatSources: (sources) => set({ initialHeatSources: sources }),
  addHeatSource: (source) =>
    set((state) => ({
      initialHeatSources: [...state.initialHeatSources, source],
    })),
  removeHeatSource: (index) =>
    set((state) => ({
      initialHeatSources: state.initialHeatSources.filter((_, i) => i !== index),
    })),
  clearHeatSources: () => set({ initialHeatSources: [] }),
  setTotalSteps: (steps) => set({ totalSteps: steps }),
  setTimeStep: (dt) => set({ timeStep: dt }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushTemperature: (temp) => set({ brushTemperature: temp }),
  setDrawMode: (mode) => set({ drawMode: mode }),
  setTempRange: (min, max) => set({ minTemp: min, maxTemp: max }),
  
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    })),
  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter(s => s.id !== id),
    })),
  setExperiments: (experiments) => set({ experiments }),
  setFavorites: (favorites) => set({ favorites }),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) =>
    set((state) => ({
      templates: [...state.templates, template],
    })),
  updateTemplate: (template) =>
    set((state) => ({
      templates: state.templates.map(t => t.id === template.id ? template : t),
    })),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter(t => t.id !== id),
    })),
  setCurrentExperimentId: (id) => set({ currentExperimentId: id }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  setShowTemplateLibrary: (show) => set({ showTemplateLibrary: show }),
  setShowSaveTemplateModal: (show) => set({ showSaveTemplateModal: show }),
  
  reset: () =>
    set((state) => ({
      mode: 'idle',
      currentStep: 0,
      currentTemperature: createEmptyTemperature(state.grid),
      temperatureHistory: [],
    })),
}));

export default useSimulationStore;
