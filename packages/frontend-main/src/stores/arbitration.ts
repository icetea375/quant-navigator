/**
 * 仲裁相关状态管理
 * Vue 3 + Pinia 版本 - 从 React + Zustand 迁移
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { arbitrationService } from '@/services/api/arbitrationService';
import { logger } from '@/utils/logger';
import type {
  ArbitrationCaseData,
  ArbitrationDecision,
  GridLayout,
  TooltipData,
  ArbitrationCaseInfo
} from '@/types/arbitration';

export const useArbitrationStore = defineStore('arbitration', () => {
  // ==================== 状态定义 ====================

  const currentCaseId = ref<string | null>(null);
  const caseData = ref<ArbitrationCaseData | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const layout = ref<GridLayout[]>([]);
  const maximizedPanel = ref<string | null>(null);
  const tooltipData = ref<TooltipData | null>(null);
  const cases = ref<ArbitrationCaseInfo[]>([]);

  // ==================== 计算属性 ====================

  const currentCase = computed(() => {
    return cases.value.find(c => c.caseId === currentCaseId.value) || null;
  });

  const hasData = computed(() => {
    return caseData.value !== null;
  });

  const isLoading = computed(() => {
    return loading.value;
  });

  const hasError = computed(() => {
    return error.value !== null;
  });

  // ==================== 动作定义 ====================

  const setCurrentCase = (caseId: string) => {
    currentCaseId.value = caseId;
  };

  const setCaseData = (data: ArbitrationCaseData) => {
    caseData.value = data;
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  const setLayout = (newLayout: GridLayout[]) => {
    layout.value = newLayout;
  };

  const setMaximizedPanel = (panelId: string | null) => {
    maximizedPanel.value = panelId;
  };

  const setTooltipData = (data: TooltipData | null) => {
    tooltipData.value = data;
  };

  const setCases = (newCases: ArbitrationCaseInfo[]) => {
    cases.value = newCases;
  };

  // ==================== API 调用 ====================

  const fetchCaseData = async (caseId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const caseData = await arbitrationService.getCaseData(caseId);
      setCaseData(caseData);
      setCurrentCase(caseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取案例数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async (filters?: Record<string, unknown>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const cases = await arbitrationService.getCasesList(filters);
      setCases(cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取案例列表失败');
    } finally {
      setLoading(false);
    }
  };

  const submitArbitration = async (decision: ArbitrationDecision): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await arbitrationService.submitArbitration(decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交仲裁决策失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== 工具方法 ====================

  const clearError = () => {
    setError(null);
  };

  const reset = () => {
    currentCaseId.value = null;
    caseData.value = null;
    loading.value = false;
    error.value = null;
    layout.value = [];
    maximizedPanel.value = null;
    tooltipData.value = null;
    cases.value = [];
  };

  const loadLayoutFromStorage = () => {
    try {
      const savedLayout = localStorage.getItem('arbitration-dashboard-layout');
      if (savedLayout) {
        layout.value = JSON.parse(savedLayout);
      }
    } catch (err) {
      logger.warn('加载布局配置失败:', err);
    }
  };

  const saveLayoutToStorage = () => {
    try {
      localStorage.setItem('arbitration-dashboard-layout', JSON.stringify(layout.value));
    } catch (err) {
      logger.warn('保存布局配置失败:', err);
    }
  };

  // ==================== 返回 store 接口 ====================

  return {
    // 状态
    currentCaseId,
    caseData,
    loading,
    error,
    layout,
    maximizedPanel,
    tooltipData,
    cases,

    // 计算属性
    currentCase,
    hasData,
    isLoading,
    hasError,

    // 动作
    setCurrentCase,
    setCaseData,
    setLoading,
    setError,
    setLayout,
    setMaximizedPanel,
    setTooltipData,
    setCases,

    // API 调用
    fetchCaseData,
    fetchCases,
    submitArbitration,

    // 工具方法
    clearError,
    reset,
    loadLayoutFromStorage,
    saveLayoutToStorage
  };
});

// 导出类型以便在其他地方使用
export type ArbitrationStore = ReturnType<typeof useArbitrationStore>;
