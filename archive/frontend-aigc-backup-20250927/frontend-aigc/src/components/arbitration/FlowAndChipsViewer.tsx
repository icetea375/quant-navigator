import React, { useState, useCallback, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Tooltip, Typography, Divider, Tabs } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import {
  MoneyCollectOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { FlowAndChipsViewerProps, FlowAndChipsData, MoneyFlowData, ChipDistributionData } from '../../types/arbitration';
import './FlowAndChipsViewer.css';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

/**
 * 资金流向与筹码分布组件
 * 展示资金流向、龙虎榜和筹码分布数据
 *
 * 核心特性：
 * 1. 资金流向可视化
 * 2. 龙虎榜数据展示
 * 3. 筹码分布图表
 * 4. 交互式数据探索
 */
const FlowAndChipsViewer: React.FC<FlowAndChipsViewerProps> = ({
  data,
  loading = false,
  error = null,
  onFlowHover,
  onChipHover
}) => {
  const [activeTab, setActiveTab] = useState<string>('flow');
  const [hoveredFlow, setHoveredFlow] = useState<MoneyFlowData | null>(null);
  const [hoveredChip, setHoveredChip] = useState<ChipDistributionData | null>(null);

  // 处理资金流向悬浮
  const handleFlowHover = useCallback((flow: MoneyFlowData) => {
    setHoveredFlow(flow);
    onFlowHover?.(flow);
  }, [onFlowHover]);

  // 处理筹码分布悬浮
  const handleChipHover = useCallback((chip: ChipDistributionData) => {
    setHoveredChip(chip);
    onChipHover?.(chip);
  }, [onChipHover]);

  // 获取资金流向数据
  const flowData = useMemo(() => {
    return data?.moneyFlow || null;
  }, [data]);

  // 获取龙虎榜数据
  const topListData = useMemo(() => {
    return data?.topList || [];
  }, [data]);

  // 获取筹码分布数据
  const chipData = useMemo(() => {
    return data?.chipDistribution || [];
  }, [data]);

  // 获取资金流向趋势数据
  const flowTrendData = useMemo(() => {
    if (!flowData) return [];

    return [
      { period: '5日均值', value: flowData.avgNetInflow5d },
      { period: '10日均值', value: flowData.avgNetInflow10d },
      { period: '20日均值', value: flowData.avgNetInflow20d },
      { period: '当前', value: flowData.netAmount }
    ];
  }, [flowData]);

  // 渲染资金流向概览
  const renderFlowOverview = () => {
    if (!flowData) return null;

    const netAmount = flowData.netAmount;
    const netRatio = flowData.netInflowRatio;
    const intensity = flowData.flowIntensity;
    const anomalyScore = flowData.flowAnomalyScore;

    const amountColor = netAmount > 0 ? '#52c41a' : '#ff4d4f';
    const ratioColor = netRatio > 0 ? '#52c41a' : '#ff4d4f';
    const intensityColor = intensity > 0.7 ? '#52c41a' : intensity > 0.4 ? '#faad14' : '#ff4d4f';

    return (
      <Card title="资金流向概览" size="small" className="flow-overview-card">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="净流入金额"
              value={netAmount}
              precision={2}
              valueStyle={{ color: amountColor, fontSize: '20px' }}
              suffix="万元"
              prefix={netAmount > 0 ? <RiseOutlined /> : <FallOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="净流入比例"
              value={netRatio}
              precision={2}
              valueStyle={{ color: ratioColor, fontSize: '20px' }}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="流向强度"
              value={intensity}
              precision={2}
              valueStyle={{ color: intensityColor, fontSize: '20px' }}
              suffix="分"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="异常评分"
              value={anomalyScore}
              precision={2}
              valueStyle={{ color: anomalyScore > 0.7 ? '#ff4d4f' : '#52c41a', fontSize: '20px' }}
              suffix="分"
            />
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染资金流向图表
  const renderFlowChart = () => {
    if (!flowData) return null;

    const chartData = [
      { name: '主力', value: flowData.mainForceRatio, amount: flowData.buyAmount },
      { name: '散户', value: flowData.retailRatio, amount: flowData.sellAmount },
      { name: '其他', value: 1 - flowData.mainForceRatio - flowData.retailRatio, amount: 0 }
    ];

    return (
      <Card title="资金流向分析" size="small" className="flow-chart-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="flow-pie-chart">
              <Title level={5}>资金结构分布</Title>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, name]} />
                  <Bar dataKey="value" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>
          <Col span={12}>
            <div className="flow-trend-chart">
              <Title level={5}>流向趋势对比</Title>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={flowTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}万元`, '净流入']} />
                  <Line type="monotone" dataKey="value" stroke="#52c41a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染龙虎榜数据
  const renderTopList = () => {
    if (topListData.length === 0) return null;

    return (
      <Card title="龙虎榜数据" size="small" className="top-list-card">
        <div className="top-list-content">
          {topListData.map((item, index) => (
            <div key={index} className="top-list-item">
              <div className="top-list-header">
                <Text strong>{item.seatName}</Text>
                <Tag color={item.seatType === 'buy' ? 'green' : 'red'}>
                  {item.seatType === 'buy' ? '买入' : '卖出'}
                </Tag>
              </div>
              <div className="top-list-details">
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Text type="secondary">净额: </Text>
                    <Text strong style={{ color: item.netAmount > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {item.netAmount.toFixed(2)}万元
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">买入: </Text>
                    <Text>{item.buyAmount.toFixed(2)}万元</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">卖出: </Text>
                    <Text>{item.sellAmount.toFixed(2)}万元</Text>
                  </Col>
                </Row>
                <div className="top-list-meta">
                  <Text type="secondary">排名: {item.netRank} | 占比: {(item.netRatio * 100).toFixed(1)}%</Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // 渲染筹码分布图表
  const renderChipDistribution = () => {
    if (chipData.length === 0) return null;

    const chartData = chipData.map(item => ({
      price: item.priceMedian,
      quantity: item.chipQuantity,
      ratio: item.chipRatio,
      cost: item.averageCost,
      profitLoss: item.profitLossRatio
    }));

    return (
      <Card title="筹码分布分析" size="small" className="chip-distribution-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="chip-distribution-chart">
              <Title level={5}>筹码分布图</Title>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'quantity' ? `${value}万股` : `${(value * 100).toFixed(1)}%`,
                      name === 'quantity' ? '筹码数量' : '筹码比例'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Col>
          <Col span={12}>
            <div className="chip-cost-analysis">
              <Title level={5}>成本分析</Title>
              <div className="cost-metrics">
                {chipData.map((item, index) => (
                  <div key={index} className="cost-metric">
                    <div className="cost-header">
                      <Text strong>价格区间: {item.priceLower}-{item.priceUpper}</Text>
                      <Text type="secondary">中位数: {item.priceMedian}</Text>
                    </div>
                    <div className="cost-details">
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Text type="secondary">平均成本: </Text>
                          <Text strong>{item.averageCost.toFixed(2)}</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">盈亏比例: </Text>
                          <Text strong style={{ color: item.profitLossRatio > 0 ? '#52c41a' : '#ff4d4f' }}>
                            {(item.profitLossRatio * 100).toFixed(1)}%
                          </Text>
                        </Col>
                      </Row>
                      <div className="cost-concentration">
                        <Text type="secondary">集中度: </Text>
                        <Progress
                          percent={item.costConcentration * 100}
                          size="small"
                          strokeColor="#1890ff"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染综合分析
  const renderComprehensiveAnalysis = () => {
    if (!flowData) return null;

    const analysis = {
      flowTrend: flowData.flowTrend > 0 ? '上升' : '下降',
      chipConcentration: chipData.length > 0 ? chipData[0].costConcentration : 0,
      mainForceRatio: flowData.mainForceRatio,
      retailRatio: flowData.retailRatio
    };

    return (
      <Card title="综合分析" size="small" className="comprehensive-analysis-card">
        <div className="analysis-content">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="analysis-item">
                <Text strong>资金流向趋势</Text>
                <div className="analysis-value">
                  <Tag color={flowData.flowTrend > 0 ? 'green' : 'red'}>
                    {analysis.flowTrend}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className="analysis-item">
                <Text strong>筹码集中度</Text>
                <div className="analysis-value">
                  <Progress
                    percent={analysis.chipConcentration * 100}
                    size="small"
                    strokeColor="#1890ff"
                  />
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className="analysis-item">
                <Text strong>主力散户比例</Text>
                <div className="analysis-value">
                  <Text>主力: {(analysis.mainForceRatio * 100).toFixed(1)}%</Text>
                  <br />
                  <Text>散户: {(analysis.retailRatio * 100).toFixed(1)}%</Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="flow-and-chips-viewer">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flow-and-chips-viewer">
        <div className="loading-state">
          <Text>加载资金流向数据中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-and-chips-viewer">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="资金流向" key="flow">
          {renderFlowOverview()}
          <Divider />
          {renderFlowChart()}
        </TabPane>
        <TabPane tab="龙虎榜" key="toplist">
          {renderTopList()}
        </TabPane>
        <TabPane tab="筹码分布" key="chips">
          {renderChipDistribution()}
        </TabPane>
        <TabPane tab="综合分析" key="analysis">
          {renderComprehensiveAnalysis()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default FlowAndChipsViewer;
