import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Row, Col, Card, Typography, Button, Space, message, Spin, Alert } from 'antd';
import { 
  ReloadOutlined, 
  SaveOutlined, 
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { useArbitrationStore } from '../../stores/arbitrationStore';
import DraggableGridLayout from './DraggableGridLayout';
import DataPanelContainer from './DataPanelContainer';
import RawTextExplorer from './RawTextExplorer';
import FinancialSnapshot from './FinancialSnapshot';
import QuantSignalDashboard from './QuantSignalDashboard';
import FlowAndChipsViewer from './FlowAndChipsViewer';
import PersonalPrecedentViewer from './PersonalPrecedentViewer';
import ArbitrationCaseList from './ArbitrationCaseList';
import { ArbitrationDashboardProps, ArbitrationCaseData } from '../../types/arbitration';
import './ArbitrationDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

/**
 * 仲裁仪表盘主组件
 * 集成所有数据面板，提供完整的仲裁决策支持
 * 
 * 核心特性：
 * 1. 动态可定制布局
 * 2. 一次性并行数据加载
 * 3. 丰富的可视化展示
 * 4. 交互式数据探索
 * 5. 性能优化支持
 * 6. 强类型安全保障
 */
const ArbitrationDashboard: React.FC<ArbitrationDashboardProps> = ({
  caseId,
  onCaseChange,
  onArbitrationSubmit
}) => {
  const {
    currentCaseId,
    caseData,
    loading,
    error,
    layout,
    maximizedPanel,
    setCurrentCase,
    setCaseData,
    setLoading,
    setError,
    setLayout,
    setMaximizedPanel,
    fetchCaseData,
    submitArbitration
  } = useArbitrationStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 初始化案例数据
  useEffect(() => {
    if (caseId && caseId !== currentCaseId) {
      setCurrentCase(caseId);
      fetchCaseData(caseId);
    }
  }, [caseId, currentCaseId, setCurrentCase, fetchCaseData]);

  // 处理案例切换
  const handleCaseChange = useCallback((newCaseId: string) => {
    setCurrentCase(newCaseId);
    fetchCaseData(newCaseId);
    onCaseChange?.(newCaseId);
  }, [setCurrentCase, fetchCaseData, onCaseChange]);

  // 处理数据刷新
  const handleRefresh = useCallback(() => {
    if (currentCaseId) {
      setRefreshKey(prev => prev + 1);
      fetchCaseData(currentCaseId);
      message.success('数据已刷新');
    }
  }, [currentCaseId, fetchCaseData]);

  // 处理布局保存
  const handleLayoutSave = useCallback(() => {
    // 保存布局到本地存储
    localStorage.setItem('arbitration-dashboard-layout', JSON.stringify(layout));
    message.success('布局已保存');
  }, [layout]);

  // 处理全屏切换
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // 处理面板最大化
  const handlePanelMaximize = useCallback((panelId: string) => {
    setMaximizedPanel(panelId);
  }, [setMaximizedPanel]);

  // 处理面板最小化
  const handlePanelMinimize = useCallback((panelId: string) => {
    // 这里可以实现面板最小化逻辑
    console.log('Minimize panel:', panelId);
  }, []);

  // 处理面板关闭
  const handlePanelClose = useCallback((panelId: string) => {
    // 这里可以实现面板关闭逻辑
    console.log('Close panel:', panelId);
  }, []);

  // 处理仲裁提交
  const handleArbitrationSubmit = useCallback((decision: any) => {
    submitArbitration(decision);
    onArbitrationSubmit?.(decision);
    message.success('仲裁决策已提交');
  }, [submitArbitration, onArbitrationSubmit]);

  // 渲染工具栏
  const renderToolbar = () => (
    <Header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <Title level={4} className="dashboard-title">
            仲裁仪表盘
            {caseData && (
              <Text type="secondary" className="case-info">
                - {caseData.caseInfo.stockCode} ({caseData.caseInfo.stockName})
              </Text>
            )}
          </Title>
        </div>
        <div className="header-right">
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleLayoutSave}
            >
              保存布局
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => console.log('Settings')}
            >
              设置
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={handleFullscreenToggle}
            >
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Space>
        </div>
      </div>
    </Header>
  );

  // 渲染侧边栏
  const renderSidebar = () => (
    <Sider width={300} className="dashboard-sidebar">
      <ArbitrationCaseList
        cases={[]} // 这里应该从store获取案例列表
        loading={loading}
        error={error}
        selectedCaseId={currentCaseId}
        onCaseSelect={handleCaseChange}
        onCaseFilter={() => {}}
      />
    </Sider>
  );

  // 渲染主内容区域
  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="dashboard-loading">
          <Spin size="large" tip="加载仲裁数据中..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-error">
          <Alert
            message="数据加载失败"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={handleRefresh}>
                重试
              </Button>
            }
          />
        </div>
      );
    }

    if (!caseData) {
      return (
        <div className="dashboard-empty">
          <Text type="secondary">请选择一个仲裁案例</Text>
        </div>
      );
    }

    return (
      <div className="dashboard-content">
        <DraggableGridLayout
          onLayoutChange={setLayout}
          onItemResize={() => {}}
          onItemMove={() => {}}
        >
          <DataPanelContainer
            title="原始文本浏览器"
            loading={loading}
            error={error}
            onMaximize={() => handlePanelMaximize('raw-text')}
            onMinimize={() => handlePanelMinimize('raw-text')}
            onClose={() => handlePanelClose('raw-text')}
            maximized={maximizedPanel === 'raw-text'}
            data-panel-id="raw-text"
            data-panel-title="原始文本浏览器"
          >
            <RawTextExplorer
              data={caseData.panels.rawTextExplorer}
              loading={loading}
              error={error}
              onTextHighlight={() => {}}
              onEventSelect={() => {}}
            />
          </DataPanelContainer>

          <DataPanelContainer
            title="财务数据快照"
            loading={loading}
            error={error}
            onMaximize={() => handlePanelMaximize('financial')}
            onMinimize={() => handlePanelMinimize('financial')}
            onClose={() => handlePanelClose('financial')}
            maximized={maximizedPanel === 'financial'}
            data-panel-id="financial"
            data-panel-title="财务数据快照"
          >
            <FinancialSnapshot
              data={caseData.panels.financialSnapshot}
              loading={loading}
              error={error}
              onPeriodSelect={() => {}}
              onMetricHover={() => {}}
            />
          </DataPanelContainer>

          <DataPanelContainer
            title="量化信号仪表盘"
            loading={loading}
            error={error}
            onMaximize={() => handlePanelMaximize('quant-signals')}
            onMinimize={() => handlePanelMinimize('quant-signals')}
            onClose={() => handlePanelClose('quant-signals')}
            maximized={maximizedPanel === 'quant-signals'}
            data-panel-id="quant-signals"
            data-panel-title="量化信号仪表盘"
          >
            <QuantSignalDashboard
              data={caseData.panels.quantSignalDashboard}
              loading={loading}
              error={error}
              onSignalHover={() => {}}
              onSignalClick={() => {}}
            />
          </DataPanelContainer>

          <DataPanelContainer
            title="资金流向与筹码分布"
            loading={loading}
            error={error}
            onMaximize={() => handlePanelMaximize('flow-chips')}
            onMinimize={() => handlePanelMinimize('flow-chips')}
            onClose={() => handlePanelClose('flow-chips')}
            maximized={maximizedPanel === 'flow-chips'}
            data-panel-id="flow-chips"
            data-panel-title="资金流向与筹码分布"
          >
            <FlowAndChipsViewer
              data={caseData.panels.flowAndChipsViewer}
              loading={loading}
              error={error}
              onFlowHover={() => {}}
              onChipHover={() => {}}
            />
          </DataPanelContainer>

          <DataPanelContainer
            title="历史仲裁记录"
            loading={loading}
            error={error}
            onMaximize={() => handlePanelMaximize('precedents')}
            onMinimize={() => handlePanelMinimize('precedents')}
            onClose={() => handlePanelClose('precedents')}
            maximized={maximizedPanel === 'precedents'}
            data-panel-id="precedents"
            data-panel-title="历史仲裁记录"
          >
            <PersonalPrecedentViewer
              data={caseData.panels.precedentViewer}
              loading={loading}
              error={error}
              onPrecedentSelect={() => {}}
              onPrecedentHover={() => {}}
            />
          </DataPanelContainer>
        </DraggableGridLayout>
      </div>
    );
  };

  return (
    <div className={`arbitration-dashboard ${isFullscreen ? 'fullscreen' : ''}`}>
      <Layout className="dashboard-layout">
        {renderToolbar()}
        <Layout className="dashboard-body">
          {renderSidebar()}
          <Content className="dashboard-main">
            {renderMainContent()}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default ArbitrationDashboard;
