import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ArbitrationState, ArbitrationActions, ArbitrationCaseData, ArbitrationDecision, GridLayout } from '../types/arbitration';

/**
 * 仲裁状态管理Store
 * 使用Zustand管理仲裁仪表盘的状态
 *
 * 核心特性：
 * 1. 状态集中管理
 * 2. 持久化存储
 * 3. 开发工具支持
 * 4. 类型安全
 */
interface ArbitrationStore extends ArbitrationState, ArbitrationActions {}

export const useArbitrationStore = create<ArbitrationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentCaseId: null,
        caseData: null,
        loading: false,
        error: null,
        layout: [],
        maximizedPanel: null,
        tooltipData: null,

        // 设置当前案例
        setCurrentCase: (caseId: string) => {
          set({ currentCaseId: caseId }, false, 'setCurrentCase');
        },

        // 设置案例数据
        setCaseData: (data: ArbitrationCaseData) => {
          set({ caseData: data }, false, 'setCaseData');
        },

        // 设置加载状态
        setLoading: (loading: boolean) => {
          set({ loading }, false, 'setLoading');
        },

        // 设置错误状态
        setError: (error: string | null) => {
          set({ error }, false, 'setError');
        },

        // 设置布局
        setLayout: (layout: GridLayout[]) => {
          set({ layout }, false, 'setLayout');
        },

        // 设置最大化面板
        setMaximizedPanel: (panelId: string | null) => {
          set({ maximizedPanel: panelId }, false, 'setMaximizedPanel');
        },

        // 设置悬浮提示数据
        setTooltipData: (data: any) => {
          set({ tooltipData: data }, false, 'setTooltipData');
        },

        // 获取案例数据
        fetchCaseData: async (caseId: string) => {
          const { setLoading, setError, setCaseData } = get();

          try {
            setLoading(true);
            setError(null);

            // 模拟API调用
            const response = await fetch(`/api/v1/admin/arbitration-cases/${caseId}`);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
              setCaseData(data.data);
            } else {
              throw new Error(data.message || 'Failed to fetch case data');
            }
          } catch (error) {
            console.error('Error fetching case data:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setLoading(false);
          }
        },

        // 提交仲裁决策
        submitArbitration: async (decision: ArbitrationDecision) => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            // 模拟API调用
            const response = await fetch('/api/v1/admin/arbitration/decide', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(decision),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.message || 'Failed to submit arbitration');
            }

            // 提交成功后可以更新本地状态
            console.log('Arbitration submitted successfully:', decision);
          } catch (error) {
            console.error('Error submitting arbitration:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            throw error;
          } finally {
            setLoading(false);
          }
        },
      }),
      {
        name: 'arbitration-store',
        partialize: (state) => ({
          layout: state.layout,
          maximizedPanel: state.maximizedPanel,
        }),
      }
    ),
    {
      name: 'arbitration-store',
    }
  )
);

// 选择器函数
export const useArbitrationCaseData = () => useArbitrationStore((state) => state.caseData);
export const useArbitrationLoading = () => useArbitrationStore((state) => state.loading);
export const useArbitrationError = () => useArbitrationStore((state) => state.error);
export const useArbitrationLayout = () => useArbitrationStore((state) => state.layout);
export const useArbitrationMaximizedPanel = () => useArbitrationStore((state) => state.maximizedPanel);
