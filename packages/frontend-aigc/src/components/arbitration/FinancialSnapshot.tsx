import React, { useState, useCallback, useMemo } from 'react';
import { Card, Statistic, Row, Col, Select, Button, Tooltip, Typography, Divider } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUpOutlined, TrendingDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { FinancialSnapshotProps, FinancialSnapshot as FinancialSnapshotType } from '../../types/arbitration';
import './FinancialSnapshot.css';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * 财务数据快照组件
 * 展示过去8个季度的核心财务指标，支持趋势可视化
 *
 * 核心特性：
 * 1. 核心财务指标展示
 * 2. 趋势图表可视化
 * 3. 交互式数据探索
 * 4. 智能数据对比
 */
const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({
  data,
  loading = false,
  error = null,
  onPeriodSelect,
  onMetricHover
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('latest');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // 处理期间选择
  const handlePeriodSelect = useCallback((period: string) => {
    setSelectedPeriod(period);
    onPeriodSelect?.(period);
  }, [onPeriodSelect]);

  // 处理指标悬浮
  const handleMetricHover = useCallback((metric: string, value: number) => {
    setHoveredMetric(metric);
    onMetricHover?.(metric, value);
  }, [onMetricHover]);

  // 获取当前期间数据
  const currentData = useMemo(() => {
    if (data.length === 0) return null;

    if (selectedPeriod === 'latest') {
      return data[0];
    }

    return data.find(item => item.reportPeriod === selectedPeriod) || data[0];
  }, [data, selectedPeriod]);

  // 获取趋势数据
  const trendData = useMemo(() => {
    return data.slice(0, 8).map(item => ({
      period: `${item.fiscalYear}${item.reportPeriod}`,
      revenue: item.revenue,
      revenueGrowth: item.revenueGrowthRate,
      netProfit: item.netProfitExcludingNonRecurring,
      netProfitGrowth: item.netProfitGrowthRate,
      grossMargin: item.grossMargin,
      netMargin: item.netMargin,
      roe: item.roe,
      roa: item.roa
    })).reverse();
  }, [data]);

  // 获取期间选项
  const periodOptions = useMemo(() => {
    return data.map(item => ({
      value: item.reportPeriod,
      label: `${item.fiscalYear}${item.reportPeriod}`
    }));
  }, [data]);

  // 渲染核心指标
  const renderCoreMetrics = () => {
    if (!currentData) return null;

    const metrics = [
      {
        title: '营业收入',
        value: currentData.revenue,
        suffix: '万元',
        precision: 2,
        trend: currentData.revenueGrowthRate,
        color: currentData.revenueGrowthRate > 0 ? '#52c41a' : '#ff4d4f'
      },
      {
        title: '扣非净利润',
        value: currentData.netProfitExcludingNonRecurring,
        suffix: '万元',
        precision: 2,
        trend: currentData.netProfitGrowthRate,
        color: currentData.netProfitGrowthRate > 0 ? '#52c41a' : '#ff4d4f'
      },
      {
        title: '毛利率',
        value: currentData.grossMargin,
        suffix: '%',
        precision: 2,
        color: currentData.grossMargin > 20 ? '#52c41a' : currentData.grossMargin > 10 ? '#faad14' : '#ff4d4f'
      },
      {
        title: '净利率',
        value: currentData.netMargin,
        suffix: '%',
        precision: 2,
        color: currentData.netMargin > 10 ? '#52c41a' : currentData.netMargin > 5 ? '#faad14' : '#ff4d4f'
      }
    ];

    return (
      <Row gutter={[16, 16]}>
        {metrics.map((metric, index) => (
          <Col span={6} key={index}>
            <Card
              size="small"
              className={`metric-card ${hoveredMetric === metric.title ? 'hovered' : ''}`}
              onMouseEnter={() => handleMetricHover(metric.title, metric.value)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <Statistic
                title={metric.title}
                value={metric.value}
                suffix={metric.suffix}
                precision={metric.precision}
                valueStyle={{ color: metric.color }}
                prefix={
                  metric.trend !== undefined ? (
                    metric.trend > 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />
                  ) : null
                }
              />
              {metric.trend !== undefined && (
                <div className="trend-indicator">
                  <Text
                    type={metric.trend > 0 ? 'success' : 'danger'}
                    style={{ fontSize: '12px' }}
                  >
                    {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(2)}%
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 渲染趋势图表
  const renderTrendChart = () => {
    if (trendData.length === 0) return null;

    return (
      <Card title="财务趋势分析" size="small" className="trend-chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(2) : value,
                getMetricLabel(name as string)
              ]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#1890ff"
              strokeWidth={2}
              name="revenue"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenueGrowth"
              stroke="#52c41a"
              strokeWidth={2}
              name="revenueGrowth"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="netProfit"
              stroke="#722ed1"
              strokeWidth={2}
              name="netProfit"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="netProfitGrowth"
              stroke="#fa8c16"
              strokeWidth={2}
              name="netProfitGrowth"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  // 渲染盈利能力指标
  const renderProfitabilityMetrics = () => {
    if (!currentData) return null;

    const metrics = [
      {
        title: 'ROE',
        value: currentData.roe,
        suffix: '%',
        description: '净资产收益率'
      },
      {
        title: 'ROA',
        value: currentData.roa,
        suffix: '%',
        description: '总资产收益率'
      },
      {
        title: 'EPS',
        value: currentData.eps,
        suffix: '元',
        description: '每股收益'
      },
      {
        title: '每股净资产',
        value: currentData.bookValuePerShare,
        suffix: '元',
        description: '每股净资产'
      }
    ];

    return (
      <Card title="盈利能力指标" size="small" className="profitability-card">
        <Row gutter={[16, 16]}>
          {metrics.map((metric, index) => (
            <Col span={6} key={index}>
              <div className="profitability-metric">
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                  precision={2}
                  valueStyle={{ fontSize: '18px' }}
                />
                <Tooltip title={metric.description}>
                  <InfoCircleOutlined className="info-icon" />
                </Tooltip>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 渲染成长性指标
  const renderGrowthMetrics = () => {
    if (!currentData) return null;

    const metrics = [
      {
        title: '3年营收复合增长率',
        value: currentData.revenueCagr3y,
        suffix: '%',
        color: currentData.revenueCagr3y > 10 ? '#52c41a' : currentData.revenueCagr3y > 5 ? '#faad14' : '#ff4d4f'
      },
      {
        title: '3年净利润复合增长率',
        value: currentData.profitCagr3y,
        suffix: '%',
        color: currentData.profitCagr3y > 15 ? '#52c41a' : currentData.profitCagr3y > 8 ? '#faad14' : '#ff4d4f'
      }
    ];

    return (
      <Card title="成长性指标" size="small" className="growth-card">
        <Row gutter={[16, 16]}>
          {metrics.map((metric, index) => (
            <Col span={12} key={index}>
              <Statistic
                title={metric.title}
                value={metric.value}
                suffix={metric.suffix}
                precision={2}
                valueStyle={{ color: metric.color, fontSize: '20px' }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 获取指标标签
  const getMetricLabel = (name: string) => {
    const labels: Record<string, string> = {
      revenue: '营业收入',
      revenueGrowth: '营收增长率',
      netProfit: '扣非净利润',
      netProfitGrowth: '净利润增长率',
      grossMargin: '毛利率',
      netMargin: '净利率'
    };
    return labels[name] || name;
  };

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="financial-toolbar">
      <Space>
        <Text strong>选择期间:</Text>
        <Select
          value={selectedPeriod}
          onChange={handlePeriodSelect}
          style={{ width: 120 }}
        >
          <Option value="latest">最新</Option>
          {periodOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Button size="small" onClick={() => setSelectedPeriod('latest')}>
          重置
        </Button>
      </Space>
    </div>
  );

  if (error) {
    return (
      <div className="financial-snapshot">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="financial-snapshot">
        <div className="loading-state">
          <Text>加载财务数据中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-snapshot">
      {renderToolbar()}
      <Divider />

      <div className="financial-content">
        {renderCoreMetrics()}

        <Divider />

        {renderTrendChart()}

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            {renderProfitabilityMetrics()}
          </Col>
          <Col span={12}>
            {renderGrowthMetrics()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default FinancialSnapshot;
