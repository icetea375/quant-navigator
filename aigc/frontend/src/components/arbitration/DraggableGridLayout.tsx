import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card, Button, Tooltip } from 'antd';
import { 
  FullscreenOutlined, 
  FullscreenExitOutlined, 
  CloseOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { DraggableGridLayoutProps, GridLayout } from '../../types/arbitration';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DraggableGridLayout.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * 可拖拽网格布局组件
 * 支持拖拽、缩放、最大化/最小化、关闭面板
 * 
 * 核心特性：
 * 1. 动态布局管理
 * 2. 面板状态控制
 * 3. 布局持久化
 * 4. 响应式设计
 */
const DraggableGridLayout: React.FC<DraggableGridLayoutProps> = ({
  children,
  onLayoutChange,
  onItemResize,
  onItemMove,
  className = ''
}) => {
  const [layout, setLayout] = useState<Layout[]>([]);
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());

  // 默认布局配置
  const defaultLayout: Layout[] = [
    { i: 'raw-text', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'financial', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'quant-signals', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'flow-chips', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'precedents', x: 0, y: 8, w: 12, h: 3, minW: 8, minH: 2 }
  ];

  // 初始化布局
  useEffect(() => {
    const savedLayout = localStorage.getItem('arbitration-dashboard-layout');
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.warn('Failed to parse saved layout, using default:', error);
        setLayout(defaultLayout);
      }
    } else {
      setLayout(defaultLayout);
    }
  }, []);

  // 保存布局到本地存储
  const saveLayout = useCallback((newLayout: Layout[]) => {
    localStorage.setItem('arbitration-dashboard-layout', JSON.stringify(newLayout));
  }, []);

  // 处理布局变化
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    saveLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange, saveLayout]);

  // 处理面板最大化
  const handleMaximize = useCallback((panelId: string) => {
    if (maximizedPanel === panelId) {
      setMaximizedPanel(null);
    } else {
      setMaximizedPanel(panelId);
    }
  }, [maximizedPanel]);

  // 处理面板最小化
  const handleMinimize = useCallback((panelId: string) => {
    setCollapsedPanels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  }, []);

  // 处理面板关闭
  const handleClose = useCallback((panelId: string) => {
    setLayout(prev => prev.filter(item => item.i !== panelId));
  }, []);

  // 处理面板移动
  const handleItemMove = useCallback((item: Layout) => {
    onItemMove?.(item);
  }, [onItemMove]);

  // 处理面板缩放
  const handleItemResize = useCallback((item: Layout) => {
    onItemResize?.(item);
  }, [onItemResize]);

  // 重置布局
  const handleResetLayout = useCallback(() => {
    setLayout(defaultLayout);
    saveLayout(defaultLayout);
    setMaximizedPanel(null);
    setCollapsedPanels(new Set());
  }, [saveLayout]);

  // 获取当前布局
  const getCurrentLayout = useCallback(() => {
    if (maximizedPanel) {
      return layout.map(item => ({
        ...item,
        w: item.i === maximizedPanel ? 12 : 0,
        h: item.i === maximizedPanel ? 12 : 0,
        x: item.i === maximizedPanel ? 0 : 0,
        y: item.i === maximizedPanel ? 0 : 0,
        static: item.i !== maximizedPanel
      }));
    }
    return layout;
  }, [layout, maximizedPanel]);

  // 渲染面板头部
  const renderPanelHeader = useCallback((panelId: string, title: string) => {
    const isMaximized = maximizedPanel === panelId;
    const isCollapsed = collapsedPanels.has(panelId);

    return (
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
        </div>
        <div className="panel-actions">
          <Tooltip title={isCollapsed ? '展开' : '最小化'}>
            <Button
              type="text"
              size="small"
              icon={isCollapsed ? <FullscreenOutlined /> : <FullscreenExitOutlined />}
              onClick={() => handleMinimize(panelId)}
            />
          </Tooltip>
          <Tooltip title={isMaximized ? '还原' : '最大化'}>
            <Button
              type="text"
              size="small"
              icon={isMaximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => handleMaximize(panelId)}
            />
          </Tooltip>
          <Tooltip title="关闭">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleClose(panelId)}
            />
          </Tooltip>
        </div>
      </div>
    );
  }, [maximizedPanel, collapsedPanels, handleMaximize, handleMinimize, handleClose]);

  // 渲染面板内容
  const renderPanelContent = useCallback((panelId: string, children: React.ReactNode) => {
    const isCollapsed = collapsedPanels.has(panelId);
    
    if (isCollapsed) {
      return null;
    }

    return (
      <div className="panel-content">
        {children}
      </div>
    );
  }, [collapsedPanels]);

  // 渲染子组件
  const renderChildren = useCallback(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const panelId = child.props['data-panel-id'] || child.key;
        const title = child.props['data-panel-title'] || '数据面板';
        
        return (
          <div key={panelId} data-grid={layout.find(item => item.i === panelId)}>
            <Card
              className={`draggable-panel ${maximizedPanel === panelId ? 'maximized' : ''} ${collapsedPanels.has(panelId) ? 'collapsed' : ''}`}
              title={renderPanelHeader(panelId, title)}
              size="small"
              bordered={false}
              bodyStyle={{ padding: 0, height: '100%' }}
            >
              {renderPanelContent(panelId, child)}
            </Card>
          </div>
        );
      }
      return child;
    });
  }, [children, layout, maximizedPanel, collapsedPanels, renderPanelHeader, renderPanelContent]);

  return (
    <div className={`draggable-grid-layout ${className}`}>
      <div className="layout-controls">
        <Tooltip title="重置布局">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={handleResetLayout}
          />
        </Tooltip>
      </div>
      
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: getCurrentLayout() }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={!maximizedPanel}
        isResizable={!maximizedPanel}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleItemMove}
        onResizeStop={handleItemResize}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
      >
        {renderChildren()}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DraggableGridLayout;
