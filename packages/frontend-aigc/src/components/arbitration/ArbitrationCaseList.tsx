import React, { useState, useCallback, useMemo } from 'react';
import { List, Card, Tag, Button, Input, Select, Typography, Space, Tooltip, Badge } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { ArbitrationCaseListProps, ArbitrationCaseInfo, CaseFilters } from '../../types/arbitration';
import './ArbitrationCaseList.css';

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * 仲裁案例列表组件
 * 展示待仲裁案例列表，支持智能筛选和排序
 *
 * 核心特性：
 * 1. 案例列表展示
 * 2. 智能筛选和搜索
 * 3. 优先级和状态管理
 * 4. 快速操作支持
 */
const ArbitrationCaseList: React.FC<ArbitrationCaseListProps> = ({
  cases,
  loading = false,
  error = null,
  selectedCaseId,
  onCaseSelect,
  onCaseFilter
}) => {
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('priority');

  // 处理案例选择
  const handleCaseSelect = useCallback((caseId: string) => {
    onCaseSelect?.(caseId);
  }, [onCaseSelect]);

  // 处理筛选
  const handleFilter = useCallback(() => {
    const filters: CaseFilters = {
      priority: priorityFilter.length > 0 ? priorityFilter : undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined
    };
    onCaseFilter?.(filters);
  }, [priorityFilter, statusFilter, onCaseFilter]);

  // 过滤和排序数据
  const filteredCases = useMemo(() => {
    let filtered = cases;

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(case =>
        case.stockCode.toLowerCase().includes(searchText.toLowerCase()) ||
        case.stockName.toLowerCase().includes(searchText.toLowerCase()) ||
        case.reportType.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 优先级过滤
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(case => priorityFilter.includes(case.priority));
    }

    // 状态过滤
    if (statusFilter.length > 0) {
      filtered = filtered.filter(case => statusFilter.includes(case.status));
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [cases, searchText, priorityFilter, statusFilter, sortBy]);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      in_progress: { color: 'blue', text: '处理中', icon: <ExclamationCircleOutlined /> },
      completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', text: status, icon: null };

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取优先级标签
  const getPriorityTag = (priority: number) => {
    const priorityConfig: Record<number, { color: string; text: string }> = {
      1: { color: 'red', text: '紧急' },
      2: { color: 'orange', text: '高' },
      3: { color: 'blue', text: '中' },
      4: { color: 'green', text: '低' },
      5: { color: 'default', text: '最低' }
    };

    const config = priorityConfig[priority] || { color: 'default', text: `P${priority}` };

    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    );
  };

  // 获取报告类型标签
  const getReportTypeTag = (type: string) => {
    const typeConfig: Record<string, { color: string; text: string }> = {
      prediction: { color: 'purple', text: '预测' },
      attribution: { color: 'blue', text: '归因' },
      verification: { color: 'green', text: '验证' },
      analysis: { color: 'orange', text: '分析' }
    };

    const config = typeConfig[type] || { color: 'default', text: type };

    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    );
  };

  // 渲染案例项
  const renderCaseItem = (caseItem: ArbitrationCaseInfo) => {
    const isSelected = selectedCaseId === caseItem.caseId;
    const isUrgent = caseItem.priority <= 2;
    const isOverdue = caseItem.status === 'pending' &&
      new Date().getTime() - new Date(caseItem.createdAt).getTime() > 24 * 60 * 60 * 1000;

    return (
      <List.Item
        key={caseItem.caseId}
        className={`case-item ${isSelected ? 'selected' : ''} ${isUrgent ? 'urgent' : ''} ${isOverdue ? 'overdue' : ''}`}
        onClick={() => handleCaseSelect(caseItem.caseId)}
      >
        <Card size="small" className="case-card">
          <div className="case-header">
            <div className="case-title">
              <Text strong>{caseItem.stockCode}</Text>
              <Text type="secondary" className="stock-name">
                {caseItem.stockName}
              </Text>
              {isUrgent && (
                <Badge status="error" text="紧急" />
              )}
              {isOverdue && (
                <Badge status="warning" text="超时" />
              )}
            </div>
            <div className="case-actions">
              <Tooltip title="查看详情">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCaseSelect(caseItem.caseId);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <div className="case-content">
            <div className="case-tags">
              {getStatusTag(caseItem.status)}
              {getPriorityTag(caseItem.priority)}
              {getReportTypeTag(caseItem.reportType)}
            </div>

            <div className="case-meta">
              <Text type="secondary">
                创建时间: {new Date(caseItem.createdAt).toLocaleString()}
              </Text>
              <br />
              <Text type="secondary">
                报告日期: {caseItem.reportDate}
              </Text>
            </div>
          </div>
        </Card>
      </List.Item>
    );
  };

  // 渲染筛选工具栏
  const renderFilterToolbar = () => (
    <div className="case-filter-toolbar">
      <Space wrap>
        <Search
          placeholder="搜索股票代码、名称或报告类型"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />

        <Select
          mode="multiple"
          placeholder="优先级"
          value={priorityFilter}
          onChange={setPriorityFilter}
          style={{ width: 120 }}
          allowClear
        >
          <Option value={1}>紧急</Option>
          <Option value={2}>高</Option>
          <Option value={3}>中</Option>
          <Option value={4}>低</Option>
          <Option value={5}>最低</Option>
        </Select>

        <Select
          mode="multiple"
          placeholder="状态"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="pending">待处理</Option>
          <Option value="in_progress">处理中</Option>
          <Option value="completed">已完成</Option>
          <Option value="rejected">已拒绝</Option>
        </Select>

        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 100 }}
        >
          <Option value="priority">优先级</Option>
          <Option value="date">时间</Option>
          <Option value="status">状态</Option>
        </Select>

        <Button
          type="primary"
          icon={<FilterOutlined />}
          onClick={handleFilter}
        >
          应用筛选
        </Button>
      </Space>
    </div>
  );

  // 渲染统计信息
  const renderStatistics = () => {
    const total = cases.length;
    const pending = cases.filter(case => case.status === 'pending').length;
    const inProgress = cases.filter(case => case.status === 'in_progress').length;
    const completed = cases.filter(case => case.status === 'completed').length;
    const urgent = cases.filter(case => case.priority <= 2).length;

    return (
      <div className="case-statistics">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <Statistic
                title="总案例数"
                value={total}
                valueStyle={{ fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <Statistic
                title="待处理"
                value={pending}
                valueStyle={{ color: '#faad14', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <Statistic
                title="处理中"
                value={inProgress}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <Statistic
                title="紧急案例"
                value={urgent}
                valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  if (error) {
    return (
      <div className="arbitration-case-list">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="arbitration-case-list">
        <div className="loading-state">
          <Text>加载仲裁案例中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="arbitration-case-list">
      <Title level={4}>仲裁案例列表</Title>

      {renderStatistics()}

      <Divider />

      {renderFilterToolbar()}

      <Divider />

      <div className="case-list">
        <List
          dataSource={filteredCases}
          renderItem={renderCaseItem}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </div>
    </div>
  );
};

export default ArbitrationCaseList;
