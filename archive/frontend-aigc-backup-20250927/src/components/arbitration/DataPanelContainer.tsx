import React from 'react';
import { Card, Spin, Alert, Button, Tooltip } from 'antd';
import {
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { DataPanelContainerProps } from '../../types/arbitration';
import './DataPanelContainer.css';

/**
 * 数据面板容器组件
 * 为所有数据面板提供统一的外壳和交互功能
 *
 * 核心特性：
 * 1. 统一的标题栏和操作按钮
 * 2. 加载状态和错误处理
 * 3. 最大化/最小化/关闭功能
 * 4. 数据刷新功能
 */
const DataPanelContainer: React.FC<DataPanelContainerProps> = ({
  title,
  children,
  loading = false,
  error = null,
  onMaximize,
  onMinimize,
  onClose,
  maximized = false,
  className = ''
}) => {
  // 处理刷新
  const handleRefresh = () => {
    // 这里可以触发数据刷新
    window.location.reload();
  };

  // 处理最大化
  const handleMaximize = () => {
    onMaximize?.();
  };

  // 处理最小化
  const handleMinimize = () => {
    onMinimize?.();
  };

  // 处理关闭
  const handleClose = () => {
    onClose?.();
  };

  // 渲染标题栏
  const renderHeader = () => (
    <div className="data-panel-header">
      <div className="panel-title">
        <span className="title-text">{title}</span>
        {loading && (
          <Spin size="small" style={{ marginLeft: 8 }} />
        )}
      </div>
      <div className="panel-actions">
        <Tooltip title="刷新数据">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          />
        </Tooltip>
        <Tooltip title={maximized ? '还原' : '最大化'}>
          <Button
            type="text"
            size="small"
            icon={maximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={handleMaximize}
          />
        </Tooltip>
        <Tooltip title="最小化">
          <Button
            type="text"
            size="small"
            icon={<FullscreenExitOutlined />}
            onClick={handleMinimize}
          />
        </Tooltip>
        <Tooltip title="关闭">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
          />
        </Tooltip>
      </div>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="data-panel-error">
      <Alert
        message="数据加载失败"
        description={error || '未知错误'}
        type="error"
        showIcon
        icon={<InfoCircleOutlined />}
        action={
          <Button size="small" onClick={handleRefresh}>
            重试
          </Button>
        }
      />
    </div>
  );

  // 渲染加载状态
  const renderLoading = () => (
    <div className="data-panel-loading">
      <Spin size="large" tip="加载中..." />
    </div>
  );

  // 渲染内容
  const renderContent = () => {
    if (error) {
      return renderError();
    }

    if (loading) {
      return renderLoading();
    }

    return (
      <div className="data-panel-content">
        {children}
      </div>
    );
  };

  return (
    <Card
      className={`data-panel-container ${maximized ? 'maximized' : ''} ${className}`}
      title={renderHeader()}
      size="small"
      bordered={false}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {renderContent()}
    </Card>
  );
};

export default DataPanelContainer;
