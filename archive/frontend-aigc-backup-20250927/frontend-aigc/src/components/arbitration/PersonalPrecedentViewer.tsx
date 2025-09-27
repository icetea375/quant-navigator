import React, { useState, useCallback, useMemo } from 'react';
import { List, Card, Tag, Tooltip, Typography, Divider, Button, Space, Rate, Progress, Row, Col, Statistic } from 'antd';
import {
  HistoryOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { PersonalPrecedentViewerProps, HistoricalArbitrations } from '../../types/arbitration';
import './PersonalPrecedentViewer.css';

const { Text, Paragraph, Title } = Typography;

/**
 * 历史仲裁记录组件
 * 展示过去一年中的历史仲裁判决，支持智能筛选和对比
 *
 * 核心特性：
 * 1. 历史判决记录展示
 * 2. 智能相似案例推荐
 * 3. 决策一致性分析
 * 4. 学习价值评估
 */
const PersonalPrecedentViewer: React.FC<PersonalPrecedentViewerProps> = ({
  data,
  loading = false,
  error = null,
  onPrecedentSelect,
  onPrecedentHover
}) => {
  const [selectedPrecedent, setSelectedPrecedent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // 处理仲裁记录选择
  const handlePrecedentSelect = useCallback((precedent: HistoricalArbitrations) => {
    setSelectedPrecedent(precedent.feedbackId);
    onPrecedentSelect?.(precedent);
  }, [onPrecedentSelect]);

  // 处理仲裁记录悬浮
  const handlePrecedentHover = useCallback((precedent: HistoricalArbitrations) => {
    onPrecedentHover?.(precedent);
  }, [onPrecedentHover]);

  // 过滤数据
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.feedbackType === filterType);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime();
        case 'score':
          return b.feedbackScore - a.feedbackScore;
        case 'learning':
          return b.learningValue - a.learningValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, filterType, sortBy]);

  // 获取反馈类型标签
  const getFeedbackTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annotation: '标注',
      arbitration: '仲裁',
      quality_review: '质量审核',
      correction: '修正',
      approval: '审批'
    };
    return labels[type] || type;
  };

  // 获取反馈类型颜色
  const getFeedbackTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annotation: 'blue',
      arbitration: 'green',
      quality_review: 'orange',
      correction: 'red',
      approval: 'purple'
    };
    return colors[type] || 'default';
  };

  // 获取评级颜色
  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      excellent: 'green',
      good: 'blue',
      average: 'orange',
      poor: 'red',
      bad: 'red'
    };
    return colors[rating] || 'default';
  };

  // 获取评级标签
  const getRatingLabel = (rating: string) => {
    const labels: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      average: '一般',
      poor: '较差',
      bad: '很差'
    };
    return labels[rating] || rating;
  };

  // 渲染仲裁记录项
  const renderPrecedentItem = (precedent: HistoricalArbitrations) => {
    const isSelected = selectedPrecedent === precedent.feedbackId;
    const typeColor = getFeedbackTypeColor(precedent.feedbackType);
    const ratingColor = getRatingColor(precedent.rating);

    return (
      <List.Item
        key={precedent.feedbackId}
        className={`precedent-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handlePrecedentSelect(precedent)}
        onMouseEnter={() => handlePrecedentHover(precedent)}
      >
        <Card size="small" className="precedent-card">
          <div className="precedent-header">
            <div className="precedent-title">
              <Text strong>{precedent.stockCode}</Text>
              <Tag color={typeColor} className="type-tag">
                {getFeedbackTypeLabel(precedent.feedbackType)}
              </Tag>
              <Tag color={ratingColor} className="rating-tag">
                {getRatingLabel(precedent.rating)}
              </Tag>
            </div>
            <div className="precedent-meta">
              <Text type="secondary">
                {new Date(precedent.feedbackDate).toLocaleDateString()}
              </Text>
            </div>
          </div>

          <div className="precedent-content">
            <Paragraph
              ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
              className="precedent-summary"
            >
              {precedent.originalSummary}
            </Paragraph>

            {precedent.feedbackComment && (
              <div className="precedent-comment">
                <Text type="secondary">反馈: </Text>
                <Text>{precedent.feedbackComment}</Text>
              </div>
            )}
          </div>

          <div className="precedent-footer">
            <div className="precedent-scores">
              <Space>
                <Tooltip title="反馈评分">
                  <Rate
                    disabled
                    value={precedent.feedbackScore}
                    style={{ fontSize: '12px' }}
                  />
                </Tooltip>
                <Tooltip title="学习价值">
                  <Text type="secondary">
                    学习价值: {precedent.learningValue.toFixed(1)}
                  </Text>
                </Tooltip>
                <Tooltip title="准确性评分">
                  <Text type="secondary">
                    准确性: {precedent.accuracyScore.toFixed(1)}
                  </Text>
                </Tooltip>
              </Space>
            </div>

            <div className="precedent-actions">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrecedentSelect(precedent);
                }}
              >
                查看详情
              </Button>
            </div>
          </div>
        </Card>
      </List.Item>
    );
  };

  // 渲染统计信息
  const renderStatistics = () => {
    const total = data.length;
    const excellent = data.filter(item => item.rating === 'excellent').length;
    const good = data.filter(item => item.rating === 'good').length;
    const average = data.filter(item => item.rating === 'average').length;
    const poor = data.filter(item => item.rating === 'poor').length;
    const bad = data.filter(item => item.rating === 'bad').length;

    const avgScore = data.reduce((sum, item) => sum + item.feedbackScore, 0) / total;
    const avgLearning = data.reduce((sum, item) => sum + item.learningValue, 0) / total;

    return (
      <Card title="仲裁统计" size="small" className="statistics-card">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="总仲裁数"
              value={total}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均评分"
              value={avgScore}
              precision={1}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均学习价值"
              value={avgLearning}
              precision={1}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="优秀率"
              value={(excellent / total * 100)}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
        </Row>

        <Divider />

        <div className="rating-distribution">
          <Text strong>评级分布</Text>
          <div className="rating-bars">
            <div className="rating-bar">
              <Text>优秀</Text>
              <Progress percent={(excellent / total * 100)} strokeColor="#52c41a" />
            </div>
            <div className="rating-bar">
              <Text>良好</Text>
              <Progress percent={(good / total * 100)} strokeColor="#1890ff" />
            </div>
            <div className="rating-bar">
              <Text>一般</Text>
              <Progress percent={(average / total * 100)} strokeColor="#faad14" />
            </div>
            <div className="rating-bar">
              <Text>较差</Text>
              <Progress percent={(poor / total * 100)} strokeColor="#ff4d4f" />
            </div>
            <div className="rating-bar">
              <Text>很差</Text>
              <Progress percent={(bad / total * 100)} strokeColor="#ff4d4f" />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="precedent-toolbar">
      <Space>
        <Text strong>筛选:</Text>
        <Button
          type={filterType === 'all' ? 'primary' : 'default'}
          size="small"
          onClick={() => setFilterType('all')}
        >
          全部
        </Button>
        <Button
          type={filterType === 'arbitration' ? 'primary' : 'default'}
          size="small"
          onClick={() => setFilterType('arbitration')}
        >
          仲裁
        </Button>
        <Button
          type={filterType === 'annotation' ? 'primary' : 'default'}
          size="small"
          onClick={() => setFilterType('annotation')}
        >
          标注
        </Button>
        <Button
          type={filterType === 'quality_review' ? 'primary' : 'default'}
          size="small"
          onClick={() => setFilterType('quality_review')}
        >
          质量审核
        </Button>

        <Divider type="vertical" />

        <Text strong>排序:</Text>
        <Button
          type={sortBy === 'date' ? 'primary' : 'default'}
          size="small"
          onClick={() => setSortBy('date')}
        >
          时间
        </Button>
        <Button
          type={sortBy === 'score' ? 'primary' : 'default'}
          size="small"
          onClick={() => setSortBy('score')}
        >
          评分
        </Button>
        <Button
          type={sortBy === 'learning' ? 'primary' : 'default'}
          size="small"
          onClick={() => setSortBy('learning')}
        >
          学习价值
        </Button>
      </Space>
    </div>
  );

  if (error) {
    return (
      <div className="personal-precedent-viewer">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="personal-precedent-viewer">
        <div className="loading-state">
          <Text>加载历史仲裁记录中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-precedent-viewer">
      {renderStatistics()}

      <Divider />

      {renderToolbar()}

      <Divider />

      <div className="precedent-list">
        <List
          dataSource={filteredData}
          renderItem={renderPrecedentItem}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </div>
    </div>
  );
};

export default PersonalPrecedentViewer;
