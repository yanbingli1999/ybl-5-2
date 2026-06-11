import { useEffect } from 'react';
import ConfigPanel from '@/components/ConfigPanel';
import HeatCanvas from '@/components/HeatCanvas';
import ControlBar from '@/components/ControlBar';
import Timeline from '@/components/Timeline';
import ExperimentPanel from '@/components/ExperimentPanel';
import TemplateLibrary from '@/components/TemplateLibrary';
import SaveTemplateModal from '@/components/SaveTemplateModal';
import useSimulationStore from '@/store/useSimulationStore';
import api from '@/services/api';
import { Flame, Library, Save } from 'lucide-react';

export default function Home() {
  const {
    setMaterials,
    setExperiments,
    setFavorites,
    setSnapshots,
    setTemplates,
    currentExperimentId,
    setShowTemplateLibrary,
    setShowSaveTemplateModal,
    templates,
  } = useSimulationStore();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [materials, experiments, favorites, templates] = await Promise.all([
          api.materials.getAll(),
          api.experiments.getAll(),
          api.favorites.getAll(),
          api.templates.getAll(),
        ]);
        
        setMaterials(materials);
        setExperiments(experiments);
        setFavorites(favorites);
        setTemplates(templates);
      } catch (error) {
        console.error('加载初始数据失败:', error);
      }
    };

    loadInitialData();
  }, [setMaterials, setExperiments, setFavorites, setTemplates]);

  useEffect(() => {
    if (currentExperimentId) {
      const loadSnapshots = async () => {
        try {
          const snapshots = await api.snapshots.getByExperiment(currentExperimentId);
          setSnapshots(snapshots);
        } catch (error) {
          console.error('加载快照失败:', error);
        }
      };
      loadSnapshots();
    }
  }, [currentExperimentId, setSnapshots]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">热扩散实验室</h1>
            <p className="text-xs text-slate-400">Heat Diffusion Simulator</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-all"
            title="将当前配置保存为模板"
          >
            <Save className="w-4 h-4" />
            保存模板
          </button>
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg transition-all"
            title="打开模板库快速套用"
          >
            <Library className="w-4 h-4" />
            模板库
            {templates.length > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {templates.length}
              </span>
            )}
          </button>
          <span className="px-2 py-1 bg-slate-800 rounded-md">v1.0.0</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ConfigPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <HeatCanvas />
          <Timeline />
          <ControlBar />
        </div>

        <ExperimentPanel />
      </div>

      <TemplateLibrary />
      <SaveTemplateModal />
    </div>
  );
}
