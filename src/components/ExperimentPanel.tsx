import React, { useState } from 'react';
import { FileText, Star, Trash2, Download, Clock, Library } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import type { ExperimentConfig, ExperimentResult, ExperimentTemplate } from '@shared/types';

export const ExperimentPanel: React.FC = () => {
  const {
    experiments,
    favorites,
    templates,
    setExperiments,
    setFavorites,
    removeTemplate,
    updateTemplate,
    setGrid,
    setBoundaryConditions,
    setMaterialId,
    setInitialHeatSources,
    setTotalSteps,
    setTimeStep,
    setCurrentExperimentId,
    setShowSaveTemplateModal,
    setShowTemplateLibrary,
    reset,
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'experiments' | 'favorites' | 'templates'>('experiments');
  const [deleteTplConfirm, setDeleteTplConfirm] = useState<string | null>(null);

  const loadExperiment = (config: ExperimentConfig) => {
    reset();
    setGrid(config.grid);
    setBoundaryConditions(config.boundaryConditions);
    setMaterialId(config.materialId);
    setInitialHeatSources(config.initialHeatSources);
    setTotalSteps(config.totalSteps);
    setCurrentExperimentId(config.id);
  };

  const deleteExperiment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.experiments.delete(id);
      setExperiments(experiments.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('删除实验失败:', error);
    }
  };

  const deleteFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.favorites.delete(id);
      setFavorites(favorites.filter(fav => fav.id !== id));
    } catch (error) {
      console.error('删除收藏失败:', error);
    }
  };

  const addToFavorites = async (config: ExperimentConfig) => {
    const result: ExperimentResult = {
      id: `fav_${Date.now()}`,
      config,
      snapshots: [],
      isFavorite: true,
      completedAt: Date.now(),
    };
    try {
      await api.favorites.create(result);
      setFavorites([...favorites, result]);
    } catch (error) {
      console.error('添加收藏失败:', error);
    }
  };

  const loadTemplate = async (template: ExperimentTemplate) => {
    try {
      await api.templates.recordUse(template.id);
    } catch {
      // ignore error
    }
    reset();
    setGrid(template.grid);
    setBoundaryConditions(template.boundaryConditions);
    setMaterialId(template.materialId);
    setInitialHeatSources(template.initialHeatSources);
    setTotalSteps(template.defaultSteps);
    setTimeStep(template.timeStep);
    setCurrentExperimentId(null);
    const updated: ExperimentTemplate = {
      ...template,
      lastUsedAt: Date.now(),
      useCount: template.useCount + 1,
    };
    updateTemplate(updated);
  };

  const deleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteTplConfirm !== id) {
      setDeleteTplConfirm(id);
      return;
    }
    try {
      await api.templates.delete(id);
      removeTemplate(id);
      setDeleteTplConfirm(null);
    } catch (error) {
      console.error('删除模板失败:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          实验管理
        </h2>
        <div className="flex gap-1 mt-3 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('experiments')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'experiments'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            实验 ({experiments.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            收藏 ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            模板 ({templates.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'experiments' && (
          <>
            {experiments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无保存的实验</p>
                <p className="text-xs mt-1">点击下方"保存实验"按钮</p>
              </div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                  onClick={() => loadExperiment(exp)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-200 truncate">
                        {exp.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(exp.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToFavorites(exp);
                        }}
                        className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-yellow-400"
                        title="添加收藏"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => deleteExperiment(exp.id, e)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {exp.grid.width}×{exp.grid.height}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {exp.totalSteps} 步
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded">
                      {exp.materialId}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      <Download className="w-3 h-3" />
                      加载此实验
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无收藏</p>
                <p className="text-xs mt-1">点击实验记录的星标收藏</p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-slate-800/50 rounded-xl p-3 border border-yellow-500/30 hover:border-yellow-500/60 transition-all cursor-pointer group"
                  onClick={() => loadExperiment(fav.config)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <h4 className="text-sm font-medium text-slate-200 truncate">
                          {fav.config.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(fav.completedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteFavorite(fav.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                      title="删除收藏"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {fav.config.grid.width}×{fav.config.grid.height}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded">
                      {fav.snapshots.length} 快照
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <button className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300">
                      <Download className="w-3 h-3" />
                      加载此实验
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'templates' && (
          <>
            <div className="flex gap-2 mb-1">
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all"
              >
                <Star className="w-3.5 h-3.5" />
                保存当前为模板
              </button>
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all"
              >
                <Library className="w-3.5 h-3.5" />
                打开模板库
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Library className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无模板</p>
                <p className="text-xs mt-1">保存常用配置，一键快速套用</p>
              </div>
            ) : (
              templates
                .slice()
                .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
                .map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-slate-800/50 rounded-xl p-3 border border-indigo-500/30 hover:border-indigo-500/60 transition-all cursor-pointer group"
                    onClick={() => loadTemplate(tpl)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-medium">
                        {tpl.category}
                      </span>
                      {deleteTplConfirm === tpl.id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => deleteTemplate(tpl.id, e)}
                            className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            删除
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTplConfirm(null); }}
                            className="px-2 py-0.5 text-[10px] bg-slate-700 text-slate-400 rounded hover:bg-slate-600"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => deleteTemplate(tpl.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                          title="删除模板"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-slate-200 truncate mb-1">
                      {tpl.name}
                    </h4>
                    {tpl.description && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-1 mb-2">
                        {tpl.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                      <span>{tpl.grid.width}×{tpl.grid.height}</span>
                      <span>·</span>
                      <span>{tpl.materialId}</span>
                      <span>·</span>
                      <span>{tpl.initialHeatSources.length}热源</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(tpl.lastUsedAt)}
                        <span className="px-1.5 py-0.5 bg-slate-700 rounded">
                          用{tpl.useCount}次
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded">
                        {tpl.defaultSteps}步
                      </span>
                    </div>
                  </div>
                ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExperimentPanel;
