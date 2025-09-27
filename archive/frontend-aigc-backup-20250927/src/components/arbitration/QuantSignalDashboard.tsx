import React, { useState, useCallback, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Tooltip, Typography, Divider } from 'antd';
import { GaugeChart, GaugeChartProps } from '@ant-design/charts';
import { RadarChart, RadarChartProps } from '@ant-design/charts';
import {
  ThunderboltOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { QuantSignalDashboardProps, QuantSignalsData } from '../../types/arbitration';
import './QuantSignalDashboard.css';

const { Text, Title } = Typography;

/**
 * 量化信号仪表盘组件
 * 展示当日量化信号和市场背景，支持可视化分析
 *
 * 核心特性：
 * 1. 仪表盘图表展示Z-Score
 * 2. 雷达图展示多维度信号
 * 3. 智能信号强度评估
 * 4. 交互式数据探索
 */
const QuantSignalDashboard: React.FC<QuantSignalDashboardProps> = ({
  data,
  loading = false,
  error = null,
  onSignalHover,
  onSignalClick
}) => {
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  // 处理信号悬浮
  const handleSignalHover = useCallback((signal: string, value: number) => {
    setHoveredSignal(signal);
    onSignalHover?.(signal, value);
  }, [onSignalHover]);

  // 处理信号点击
  const handleSignalClick = useCallback((signal: QuantSignalsData) => {
    onSignalClick?.(signal);
  }, [onSignalClick]);

  // 获取最新信号数据
  const latestSignal = useMemo(() => {
    return data.length > 0 ? data[0] : null;
  }, [data]);

  // 获取信号强度等级
  const getSignalStrength = (value: number) => {
    if (Math.abs(value) >= 2) return { level: 'strong', color: '#ff4d4f' };
    if (Math.abs(value) >= 1.5) return { level: 'medium', color: '#faad14' };
    if (Math.abs(value) >= 1) return { level: 'weak', color: '#52c41a' };
    return { level: 'neutral', color: '#d9d9d9' };
  };

  // 获取信号方向
  const getSignalDirection = (value: number) => {
    if (value > 0) return { direction: 'up', icon: <TrendingUpOutlined />, color: '#52c41a' };
    if (value < 0) return { direction: 'down', icon: <TrendingDownOutlined />, color: '#ff4d4f' };
    return { direction: 'neutral', icon: null, color: '#d9d9d9' };
  };

  // 渲染Z-Score仪表盘
  const renderZScoreGauge = (title: string, value: number, color: string) => {
    const config: GaugeChartProps = {
      percent: Math.min(Math.abs(value) / 3, 1),
      range: {
        color: color,
      },
      indicator: {
        pointer: {
          style: {
            stroke: color,
          },
        },
        pin: {
          style: {
            stroke: color,
          },
        },
      },
      statistic: {
        content: {
          style: {
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          formatter: () => `${value.toFixed(2)}`,
        },
      },
    };

    return (
      <Card size="small" className="gauge-card">
        <Title level={5}>{title}</Title>
        <GaugeChart {...config} height={120} />
        <div className="gauge-footer">
          <Text type="secondary">Z-Score: {value.toFixed(2)}</Text>
        </div>
      </Card>
    );
  };

  // 渲染个股信号
  const renderIndividualSignals = () => {
    if (!latestSignal) return null;

    const signals = [
      {
        title: '收益率Z-Score',
        value: latestSignal.returnZScore,
        description: '个股收益率相对历史均值的偏离程度'
      },
      {
        title: '成交量Z-Score',
        value: latestSignal.volumeZScore,
        description: '成交量相对历史均值的偏离程度'
      },
      {
        title: '动量Z-Score',
        value: latestSignal.momentumZScore,
        description: '价格动量相对历史均值的偏离程度'
      },
      {
        title: '波动率Z-Score',
        value: latestSignal.volatilityZScore,
        description: '价格波动率相对历史均值的偏离程度'
      }
    ];

    return (
      <Card title="个股信号" size="small" className="individual-signals-card">
        <Row gutter={[16, 16]}>
          {signals.map((signal, index) => {
            const strength = getSignalStrength(signal.value);
            const direction = getSignalDirection(signal.value);

            return (
              <Col span={6} key={index}>
                <div
                  className={`signal-item ${hoveredSignal === signal.title ? 'hovered' : ''}`}
                  onMouseEnter={() => handleSignalHover(signal.title, signal.value)}
                  onMouseLeave={() => setHoveredSignal(null)}
                  onClick={() => handleSignalClick(latestSignal)}
                >
                  <div className="signal-header">
                    <Text strong>{signal.title}</Text>
                    <Tooltip title={signal.description}>
                      <InfoCircleOutlined className="info-icon" />
                    </Tooltip>
                  </div>
                  <div className="signal-value">
                    <Text
                      style={{
                        fontSize: '24px',
                        color: direction.color,
                        fontWeight: 'bold'
                      }}
                    >
                      {direction.icon} {signal.value.toFixed(2)}
                    </Text>
                  </div>
                  <div className="signal-strength">
                    <Tag color={strength.color}>
                      {strength.level === 'strong' ? '强' :
                       strength.level === 'medium' ? '中' :
                       strength.level === 'weak' ? '弱' : '中性'}
                    </Tag>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  // 渲染市场背景信号
  const renderMarketSignals = () => {
    if (!latestSignal) return null;

    const signals = [
      {
        title: '宏观风险Z-Score',
        value: latestSignal.macroRiskZScore,
        description: '宏观风险偏好相对历史均值的偏离程度'
      },
      {
        title: '市场风格Z-Score',
        value: latestSignal.marketStyleZScore,
        description: '市场风格因子相对历史均值的偏离程度'
      },
      {
        title: '行业轮动Z-Score',
        value: latestSignal.industryRotationZScore,
        description: '行业轮动相对历史均值的偏离程度'
      },
      {
        title: '概念Z-Score',
        value: latestSignal.conceptZScore,
        description: '概念板块相对历史均值的偏离程度'
      }
    ];

    return (
      <Card title="市场背景信号" size="small" className="market-signals-card">
        <Row gutter={[16, 16]}>
          {signals.map((signal, index) => {
            const strength = getSignalStrength(signal.value);
            const direction = getSignalDirection(signal.value);

            return (
              <Col span={6} key={index}>
                <div
                  className={`signal-item ${hoveredSignal === signal.title ? 'hovered' : ''}`}
                  onMouseEnter={() => handleSignalHover(signal.title, signal.value)}
                  onMouseLeave={() => setHoveredSignal(null)}
                  onClick={() => handleSignalClick(latestSignal)}
                >
                  <div className="signal-header">
                    <Text strong>{signal.title}</Text>
                    <Tooltip title={signal.description}>
                      <InfoCircleOutlined className="info-icon" />
                    </Tooltip>
                  </div>
                  <div className="signal-value">
                    <Text
                      style={{
                        fontSize: '20px',
                        color: direction.color,
                        fontWeight: 'bold'
                      }}
                    >
                      {direction.icon} {signal.value.toFixed(2)}
                    </Text>
                  </div>
                  <div className="signal-strength">
                    <Tag color={strength.color}>
                      {strength.level === 'strong' ? '强' :
                       strength.level === 'medium' ? '中' :
                       strength.level === 'weak' ? '弱' : '中性'}
                    </Tag>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  // 渲染管理层可信度因子
  const renderManagementFactors = () => {
    if (!latestSignal) return null;

    const factors = [
      {
        title: 'MD&A履约率',
        value: latestSignal.mdaFulfillmentRate,
        suffix: '%',
        description: '管理层承诺的履约完成率'
      },
      {
        title: '管理层可信度',
        value: latestSignal.managementCredibilityScore,
        suffix: '分',
        description: '管理层整体可信度评分'
      },
      {
        title: '披露质量',
        value: latestSignal.disclosureQualityScore,
        suffix: '分',
        description: '信息披露质量评分'
      },
      {
        title: '财务透明度',
        value: latestSignal.financialTransparencyScore,
        suffix: '分',
        description: '财务数据透明度评分'
      }
    ];

    return (
      <Card title="管理层可信度因子" size="small" className="management-factors-card">
        <Row gutter={[16, 16]}>
          {factors.map((factor, index) => {
            const color = factor.value > 0.7 ? '#52c41a' : factor.value > 0.5 ? '#faad14' : '#ff4d4f';

            return (
              <Col span={6} key={index}>
                <div className="factor-item">
                  <div className="factor-header">
                    <Text strong>{factor.title}</Text>
                    <Tooltip title={factor.description}>
                      <InfoCircleOutlined className="info-icon" />
                    </Tooltip>
                  </div>
                  <div className="factor-value">
                    <Text
                      style={{
                        fontSize: '24px',
                        color: color,
                        fontWeight: 'bold'
                      }}
                    >
                      {factor.value.toFixed(2)}{factor.suffix}
                    </Text>
                  </div>
                  <div className="factor-progress">
                    <Progress
                      percent={factor.value * 100}
                      strokeColor={color}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  // 渲染综合评分
  const renderOverallScore = () => {
    if (!latestSignal) return null;

    const overallScore = latestSignal.overallSignalStrength;
    const confidence = latestSignal.signalConfidence;
    const validityDays = latestSignal.validityDays;

    const scoreColor = overallScore > 0.7 ? '#52c41a' : overallScore > 0.4 ? '#faad14' : '#ff4d4f';
    const confidenceColor = confidence > 0.8 ? '#52c41a' : confidence > 0.6 ? '#faad14' : '#ff4d4f';

    return (
      <Card title="综合评分" size="small" className="overall-score-card">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="信号强度"
              value={overallScore}
              precision={2}
              valueStyle={{ color: scoreColor, fontSize: '24px' }}
              suffix="分"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="信号置信度"
              value={confidence}
              precision={2}
              valueStyle={{ color: confidenceColor, fontSize: '24px' }}
              suffix="分"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="有效期"
              value={validityDays}
              valueStyle={{ fontSize: '24px' }}
              suffix="天"
            />
          </Col>
        </Row>

        <div className="score-warning">
          {overallScore < 0.3 && (
            <div className="warning-item">
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <Text type="danger">信号强度较弱，建议谨慎操作</Text>
            </div>
          )}
          {confidence < 0.6 && (
            <div className="warning-item">
              <WarningOutlined style={{ color: '#faad14' }} />
              <Text type="warning">信号置信度较低，建议进一步验证</Text>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="quant-signal-dashboard">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quant-signal-dashboard">
        <div className="loading-state">
          <Text>加载量化信号中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="quant-signal-dashboard">
      <div className="dashboard-content">
        {renderIndividualSignals()}

        <Divider />

        {renderMarketSignals()}

        <Divider />

        {renderManagementFactors()}

        <Divider />

        {renderOverallScore()}
      </div>
    </div>
  );
};

export default QuantSignalDashboard;
