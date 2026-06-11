import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Tag, FileText, Hash } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import { TEMPLATE_CATEGORIES, TemplateCategory, ExperimentTemplate } from '@shared/types';

interface ConflictInfo {
  existing: ExperimentTemplate;
}

export const SaveTemplateModal: React.FC = () => {
  const {
    showSaveTemplateModal,
    setShowSaveTemplateModal,
    grid,
    boundaryConditions,
    materialId,
    initialHeatSources,
    totalSteps,
    timeStep,
    addTemplate,
    updateTemplate,
  } = useSimulationStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('自定义');
  const [description, setDescription] = useState('');
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showSaveTemplateModal) {
      setName('');
      setCategory('自定义');
      setDescription('');
      setConflict(null);
      setError('');
      setSaving(false);
    }
  }, [showSaveTemplateModal]);

  if (!showSaveTemplateModal) return null;

  const handleClose = () => {
    setShowSaveTemplateModal(false);
  };

  const buildTemplate = (): ExperimentTemplate => ({
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    category,
    description: description.trim(),
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    useCount: 0,
    grid: { ...grid },
    materialId,
    boundaryConditions: { ...boundaryConditions },
    initialHeatSources: initialHeatSources.map(s => ({ ...s })),
    defaultSteps: totalSteps,
    timeStep,
  });

  const handleCheckAndCreate = async () => {
    if (!name.trim()) {
      setError('请输入模板名称');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const template = buildTemplate();
      const result = await api.templates.checkAndSave(template, 'create');
      if ('error' in result && result.error === 'NAME_CONFLICT') {
        setConflict({ existing: result.existing });
      } else {
        addTemplate(result as ExperimentTemplate);
        setShowSaveTemplateModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleOverwrite = async () => {
    if (!conflict) return;
    setSaving(true);
    try {
      const template = buildTemplate();
      const result = await api.templates.checkAndSave(template, 'overwrite');
      if (!('error' in result)) {
        updateTemplate(result as ExperimentTemplate);
        setShowSaveTemplateModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '合并失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    setSaving(true);
    try {
      const template = buildTemplate();
      const result = await api.templates.checkAndSave(template, 'rename');
      if (!('error' in result)) {
        addTemplate(result as ExperimentTemplate);
        setShowSaveTemplateModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '另存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConflict = () => {
    setConflict(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {conflict ? '模板名称重复' : '保存为模板'}
              </h2>
              <p className="text-xs text-slate-400">
                {conflict ? '请选择如何处理同名模板' : '将当前实验配置保存为可复用模板'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!conflict ? (
          <>
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Hash className="w-4 h-4 text-blue-400" />
                  模板名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入模板名称，如：铜片中心加热实验"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  maxLength={50}
                />
                <p className="text-xs text-slate-500 text-right">{name.length}/50</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Tag className="w-4 h-4 text-purple-400" />
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FileText className="w-4 h-4 text-orange-400" />
                  适用说明
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述模板适用场景、特殊条件等..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-slate-500 text-right">{description.length}/200</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                <p className="text-xs font-semibold text-slate-400 mb-2">将保存的配置项</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    网格 {grid.width}×{grid.height}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    材料 {materialId}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    热源 {initialHeatSources.length} 个
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    默认 {totalSteps} 步
                  </div>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-700 flex gap-3">
              <button
                onClick={handleClose}
                disabled={saving}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleCheckAndCreate}
                disabled={saving || !name.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 保存中...</>
                ) : (
                  <><Save className="w-4 h-4" /> 保存模板</>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 space-y-5">
              <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="w-10 h-10 shrink-0 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-400 mb-1">
                    已存在同名模板："{conflict.existing.name}"
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    分类：{conflict.existing.category} · 创建于 {new Date(conflict.existing.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  {conflict.existing.description && (
                    <p className="text-xs text-slate-500 italic">"{conflict.existing.description}"</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">现有配置</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div>网格 {conflict.existing.grid.width}×{conflict.existing.grid.height}</div>
                    <div>材料 {conflict.existing.materialId}</div>
                    <div>热源 {conflict.existing.initialHeatSources.length} 个</div>
                    <div>默认 {conflict.existing.defaultSteps} 步</div>
                  </div>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 mb-2">当前配置</p>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div>网格 {grid.width}×{grid.height}</div>
                    <div>材料 {materialId}</div>
                    <div>热源 {initialHeatSources.length} 个</div>
                    <div>默认 {totalSteps} 步</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-700 space-y-2">
              <button
                onClick={handleOverwrite}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? '处理中...' : '合并（覆盖现有配置，保留创建时间）'}
              </button>
              <button
                onClick={handleSaveAsNew}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? '处理中...' : '另存为（自动重命名，如 "名称 (1)"）'}
              </button>
              <button
                onClick={handleCancelConflict}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                返回修改名称
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveTemplateModal;
