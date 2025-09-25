import React, { useState, useCallback, useMemo } from 'react';
import { List, Card, Tag, Tooltip, Input, Select, Button, Space, Typography, Divider } from 'antd';
import { SearchOutlined, FilterOutlined, HighlightOutlined, LinkOutlined } from '@ant-design/icons';
import { FixedSizeList as List as VirtualList } from 'react-window';
import { RawTextExplorerProps, RawTextData } from '../../types/arbitration';
import './RawTextExplorer.css';

const { Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * 原始文本浏览器组件
 * 展示AI分析的原文，支持高亮关键词和交互联动
 * 
 * 核心特性：
 * 1. 虚拟列表支持大数据量
 * 2. 关键词高亮和悬浮提示
 * 3. 智能搜索和过滤
 * 4. 交互联动支持
 */
const RawTextExplorer: React.FC<RawTextExplorerProps> = ({
  data,
  loading = false,
  error = null,
  onTextHighlight,
  onEventSelect
}) => {
  const [searchText, setSearchText] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [highlightedKeywords, setHighlightedKeywords] = useState<string[]>([]);

  // 过滤数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchText || 
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.content.toLowerCase().includes(searchText.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesType = eventTypeFilter === 'all' || item.eventType === eventTypeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [data, searchText, eventTypeFilter]);

  // 获取所有事件类型
  const eventTypes = useMemo(() => {
    const types = Array.from(new Set(data.map(item => item.eventType)));
    return types.map(type => ({
      value: type,
      label: getEventTypeLabel(type)
    }));
  }, [data]);

  // 获取事件类型标签
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      news: '新闻',
      announcement: '公告',
      e_interaction: 'e互动',
      financial_report: '财报',
      other: '其他'
    };
    return labels[type] || type;
  };

  // 获取事件类型颜色
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      news: 'blue',
      announcement: 'green',
      e_interaction: 'orange',
      financial_report: 'purple',
      other: 'default'
    };
    return colors[type] || 'default';
  };

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  // 处理事件类型过滤
  const handleEventTypeChange = useCallback((value: string) => {
    setEventTypeFilter(value);
  }, []);

  // 处理事件选择
  const handleEventSelect = useCallback((event: RawTextData) => {
    setSelectedEvent(event.eventId);
    onEventSelect?.(event);
  }, [onEventSelect]);

  // 处理关键词高亮
  const handleKeywordHighlight = useCallback((keyword: string) => {
    setHighlightedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
    onTextHighlight?.(keyword, highlightedKeywords);
  }, [highlightedKeywords, onTextHighlight]);

  // 高亮文本中的关键词
  const highlightText = useCallback((text: string, keywords: string[]) => {
    if (keywords.length === 0) return text;
    
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.replace(regex, '<mark class="highlighted-keyword">$1</mark>');
  }, []);

  // 渲染关键词标签
  const renderKeywords = useCallback((keywords: string[]) => {
    return keywords.map((keyword, index) => (
      <Tag
        key={index}
        color={highlightedKeywords.includes(keyword) ? 'red' : 'default'}
        className="keyword-tag"
        onClick={() => handleKeywordHighlight(keyword)}
        style={{ cursor: 'pointer' }}
      >
        {keyword}
      </Tag>
    ));
  }, [highlightedKeywords, handleKeywordHighlight]);

  // 渲染事件项
  const renderEventItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = filteredData[index];
    if (!event) return null;

    const isSelected = selectedEvent === event.eventId;
    const highlightedContent = highlightText(event.content, highlightedKeywords);

    return (
      <div style={style}>
        <Card
          className={`event-item ${isSelected ? 'selected' : ''}`}
          size="small"
          hoverable
          onClick={() => handleEventSelect(event)}
        >
          <div className="event-header">
            <div className="event-title">
              <Text strong>{event.title}</Text>
              <Tag color={getEventTypeColor(event.eventType)} className="event-type-tag">
                {getEventTypeLabel(event.eventType)}
              </Tag>
            </div>
            <div className="event-meta">
              <Text type="secondary" className="event-date">
                {new Date(event.publishedAt).toLocaleString()}
              </Text>
              {event.sourceUrl && (
                <Tooltip title="查看原文">
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    href={event.sourceUrl}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              )}
            </div>
          </div>
          
          <div className="event-content">
            <Paragraph
              ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
              className="event-text"
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </div>
          
          <div className="event-footer">
            <div className="event-keywords">
              {renderKeywords(event.keywords)}
            </div>
            <div className="event-scores">
              {event.importanceScore && (
                <Tooltip title="重要性评分">
                  <Tag color="red">重要性: {(event.importanceScore * 100).toFixed(1)}%</Tag>
                </Tooltip>
              )}
              {event.sentimentScore && (
                <Tooltip title="情感评分">
                  <Tag color={event.sentimentScore > 0.5 ? 'green' : 'red'}>
                    情感: {(event.sentimentScore * 100).toFixed(1)}%
                  </Tag>
                </Tooltip>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }, [filteredData, selectedEvent, highlightedKeywords, highlightText, renderKeywords, handleEventSelect]);

  // 渲染空状态
  const renderEmpty = () => (
    <div className="empty-state">
      <Text type="secondary">暂无原始文本数据</Text>
    </div>
  );

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="raw-text-toolbar">
      <Space>
        <Search
          placeholder="搜索标题、内容或关键词"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          value={eventTypeFilter}
          onChange={handleEventTypeChange}
          style={{ width: 120 }}
        >
          <Option value="all">全部类型</Option>
          {eventTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
        <Button
          icon={<HighlightOutlined />}
          onClick={() => setHighlightedKeywords([])}
        >
          清除高亮
        </Button>
      </Space>
    </div>
  );

  if (error) {
    return (
      <div className="raw-text-explorer">
        <div className="error-state">
          <Text type="danger">加载失败: {error}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="raw-text-explorer">
      {renderToolbar()}
      <Divider />
      <div className="event-list-container">
        {filteredData.length === 0 ? (
          renderEmpty()
        ) : (
          <VirtualList
            height={600}
            itemCount={filteredData.length}
            itemSize={200}
            width="100%"
          >
            {renderEventItem}
          </VirtualList>
        )}
      </div>
    </div>
  );
};

export default RawTextExplorer;
