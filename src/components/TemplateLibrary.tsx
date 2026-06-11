import React, { useState, useMemo } from 'react';
import { X, Library, Search, Clock, Grid, Thermometer, Flame, Square, Play, Trash2, Tag, ArrowUpDown, Zap } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import { TEMPLATE_CATEGORIES, ExperimentTemplate, TemplateCategory } from '@shared/types';

type SortField = 'lastUsedAt' | 'createdAt' | 'useCount' | 'name';

export const TemplateLibrary: React.FC = () => {
  const {
    showTemplateLibrary,
    setShowTemplateLibrary,
    templates,
    removeTemplate,
    updateTemplate,
    reset,
    setGrid,
    setBoundaryConditions,
    setMaterialId,
    setInitialHeatSources,
    setTotalSteps,
    setTimeStep,
    materials,
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('lastUsedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.materialId.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }
      return ((aVal as number) - (bVal as number)) * order;
    });

    return result;
  }, [templates, selectedCategory, searchQuery, sortBy, sortOrder]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    TEMPLATE_CATEGORIES.forEach(cat => {
      counts[cat] = templates.filter(t => t.category === cat).length;
    });
    return counts;
  }, [templates]);

  if (!showTemplateLibrary) return null;

  const handleClose = () => {
    setShowTemplateLibrary(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return formatDate(timestamp);
  };

  const handleApplyTemplate = async (template: ExperimentTemplate) => {
    setLoading(template.id);
    try {
      await api.templates.recordUse(template.id);
      reset();
      setGrid(template.grid);
      setBoundaryConditions(template.boundaryConditions);
      setMaterialId(template.materialId);
      setInitialHeatSources(template.initialHeatSources);
      setTotalSteps(template.defaultSteps);
      setTimeStep(template.timeStep);
      const updated: ExperimentTemplate = {
        ...template,
        lastUsedAt: Date.now(),
        useCount: template.useCount + 1,
      };
      updateTemplate(updated);
      setShowTemplateLibrary(false);
    } catch (error) {
      console.error('应用模板失败:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.templates.delete(deleteConfirm);
      removeTemplate(deleteConfirm);
    } catch (error) {
      console.error('删除模板失败:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const categoryColors: Record<TemplateCategory, string> = {
    '基础实验': 'from-blue-500 to-cyan-500',
    '材料对比': 'from-purple-500 to-indigo-500',
    '边界效应': 'from-orange-500 to-amber-500',
    '热源布局': 'from-red-500 to-rose-500',
    '工业应用': 'from-emerald-500 to-teal-500',
    '教学案例': 'from-pink-500 to-fuchsia-500',
    '自定义': 'from-slate-500 to-slate-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[1000px] max-w-full h-[85vh] max-h-[800px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">实验模板库</h2>
              <p className="text-xs text-slate-400">共 {templates.length} 个模板 · 一键套用，快速开始</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-700 space-y-4 shrink-0">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板名称、描述、分类、材料..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 border border-slate-600">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              {(['lastUsedAt', 'createdAt', 'useCount', 'name'] as SortField[]).map(field => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sortBy === field
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {field === 'lastUsedAt' ? '最近使用' : field === 'createdAt' ? '创建时间' : field === 'useCount' ? '使用次数' : '名称'}
                  {sortBy === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700'
              }`}
            >
              <Library className="w-3 h-3" />
              全部 ({categoryCounts.all})
            </button>
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? `bg-gradient-to-r ${categoryColors[cat]} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700'
                }`}
              >
                <Tag className="w-3 h-3" />
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {filteredTemplates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Library className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">暂无模板</p>
              <p className="text-sm">
                {templates.length === 0
                  ? '点击"保存为模板"按钮，将常用配置保存起来'
                  : '没有符合当前筛选条件的模板'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const material = materials.find(m => m.id === template.materialId);
                return (
                  <div
                    key={template.id}
                    className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 hover:border-indigo-500/50 transition-all group cursor-pointer relative"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {deleteConfirm === template.id ? (
                        <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-red-500/30">
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            确认
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                            className="px-2 py-1 text-xs bg-slate-700 text-slate-400 rounded hover:bg-slate-600"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDelete(template.id, e)}
                          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                          title="删除模板"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${categoryColors[template.category]} mb-3`}>
                      <Tag className="w-3 h-3" />
                      {template.category}
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1 pr-8 line-clamp-1">
                      {template.name}
                    </h3>

                    {template.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2 italic">
                        "{template.description}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Grid className="w-3.5 h-3.5 text-blue-400" />
                        <span>{template.grid.width}×{template.grid.height}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Square className="w-3.5 h-3.5 text-purple-400" />
                        <span>{material?.name || template.materialId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span>T={template.boundaryConditions.top}°~{template.boundaryConditions.bottom}°</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                        <span>{template.initialHeatSources.length} 热源</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRelativeTime(template.lastUsedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          {template.useCount} 次
                        </div>
                        <div className="text-slate-500">
                          {template.defaultSteps}步
                        </div>
                      </div>
                      <button
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          loading === template.id
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700'
                        }`}
                        disabled={loading === template.id}
                        onClick={(e) => { e.stopPropagation(); handleApplyTemplate(template); }}
                      >
                        {loading === template.id ? (
                          <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 应用中</>
                        ) : (
                          <><Play className="w-3 h-3" /> 套用</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
