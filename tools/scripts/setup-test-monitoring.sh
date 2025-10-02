#!/bin/bash
# 测试监控告警设置脚本
# 遵循测试宪法第14条：测试执行统一化

set -e

echo "🔔 设置测试监控告警..."
echo "遵循测试宪法第14条：测试执行统一化"
echo ""

# 创建监控配置目录
mkdir -p tools/monitoring
mkdir -p tools/alerts

# 创建测试失败告警脚本
cat > tools/scripts/test-failure-alert.sh << 'EOF'
#!/bin/bash
# 测试失败告警脚本

TEST_RESULT=$1
TEST_NAME=$2
FAILURE_REASON=$3
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 发送邮件告警
if command -v mail &> /dev/null; then
    echo "测试失败告警

测试名称: $TEST_NAME
失败原因: $FAILURE_REASON
失败时间: $TIMESTAMP
测试结果: $TEST_RESULT

请检查测试环境和服务状态。" | mail -s "E2E测试失败告警" admin@example.com
fi

# 发送Slack告警（如果配置了webhook）
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 E2E测试失败告警\\n\\n测试名称: $TEST_NAME\\n失败原因: $FAILURE_REASON\\n失败时间: $TIMESTAMP\"}" \
        $SLACK_WEBHOOK_URL
fi

# 记录到日志文件
echo "[$TIMESTAMP] E2E测试失败: $TEST_NAME - $FAILURE_REASON" >> logs/test-failures.log
EOF

chmod +x tools/scripts/test-failure-alert.sh

# 创建测试监控配置
cat > tools/monitoring/test-monitoring.yml << 'EOF'
# 测试监控配置
monitoring:
  enabled: true
  check_interval: 300  # 5分钟检查一次
  failure_threshold: 3  # 连续失败3次触发告警
  
alerts:
  email:
    enabled: true
    recipients:
      - admin@example.com
      - dev-team@example.com
    smtp:
      host: smtp.example.com
      port: 587
      username: alerts@example.com
      password: ${SMTP_PASSWORD}
      
  slack:
    enabled: false
    webhook_url: ${SLACK_WEBHOOK_URL}
    channel: "#alerts"
    
  webhook:
    enabled: false
    url: ${WEBHOOK_URL}
    
test_groups:
  - name: "ai-training"
    critical: true
    timeout: 300
  - name: "system"
    critical: true
    timeout: 300
  - name: "reports"
    critical: true
    timeout: 600
  - name: "arbitration"
    critical: false
    timeout: 300
  - name: "attribution"
    critical: false
    timeout: 300
  - name: "market"
    critical: false
    timeout: 300
  - name: "performance"
    critical: true
    timeout: 900
  - name: "error-handling"
    critical: true
    timeout: 300
  - name: "network"
    critical: true
    timeout: 300
  - name: "auth"
    critical: true
    timeout: 300
  - name: "stock-pool"
    critical: false
    timeout: 300
EOF

# 创建测试健康检查脚本
cat > tools/scripts/test-health-check.sh << 'EOF'
#!/bin/bash
# 测试健康检查脚本

echo "🔍 执行测试健康检查..."

# 检查服务状态
check_service() {
    local service_name=$1
    local service_url=$2
    
    if curl -s -f "$service_url" > /dev/null; then
        echo "✅ $service_name 服务正常"
        return 0
    else
        echo "❌ $service_name 服务异常"
        return 1
    fi
}

# 检查前端服务
check_service "前端" "http://localhost:3000"

# 检查后端服务
check_service "后端API" "http://localhost:3001/health"

# 检查数据库连接
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -d quant_navigator -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ 数据库连接正常"
    else
        echo "❌ 数据库连接异常"
    fi
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  磁盘使用率过高: ${DISK_USAGE}%"
else
    echo "✅ 磁盘使用率正常: ${DISK_USAGE}%"
fi

# 检查内存使用
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️  内存使用率过高: ${MEMORY_USAGE}%"
else
    echo "✅ 内存使用率正常: ${MEMORY_USAGE}%"
fi

echo "🏁 健康检查完成"
EOF

chmod +x tools/scripts/test-health-check.sh

# 创建测试监控守护进程
cat > tools/scripts/test-monitor-daemon.sh << 'EOF'
#!/bin/bash
# 测试监控守护进程

MONITORING_CONFIG="tools/monitoring/test-monitoring.yml"
LOG_FILE="logs/test-monitor.log"
PID_FILE="tools/monitoring/test-monitor.pid"

start_monitor() {
    if [ -f "$PID_FILE" ]; then
        echo "监控进程已在运行 (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    echo "启动测试监控守护进程..."
    nohup bash -c "
        while true; do
            echo \"[$(date)] 执行健康检查...\" >> $LOG_FILE
            ./tools/scripts/test-health-check.sh >> $LOG_FILE 2>&1
            
            # 检查是否有测试失败
            if [ -f logs/test-failures.log ]; then
                FAILURE_COUNT=\$(tail -n 10 logs/test-failures.log | grep -c \"E2E测试失败\" || echo 0)
                if [ \"\$FAILURE_COUNT\" -ge 3 ]; then
                    echo \"[$(date)] 检测到连续测试失败，发送告警...\" >> $LOG_FILE
                    ./tools/scripts/test-failure-alert.sh \"连续失败\" \"E2E测试\" \"连续失败\$FAILURE_COUNT次\"
                fi
            fi
            
            sleep 300  # 5分钟检查一次
        done
    " > /dev/null 2>&1 &
    
    echo $! > $PID_FILE
    echo "监控进程已启动 (PID: $!)"
}

stop_monitor() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm -f $PID_FILE
            echo "监控进程已停止"
        else
            echo "监控进程未运行"
            rm -f $PID_FILE
        fi
    else
        echo "监控进程未运行"
    fi
}

case "$1" in
    start)
        start_monitor
        ;;
    stop)
        stop_monitor
        ;;
    restart)
        stop_monitor
        sleep 2
        start_monitor
        ;;
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat $PID_FILE)
            if kill -0 $PID 2>/dev/null; then
                echo "监控进程正在运行 (PID: $PID)"
            else
                echo "监控进程未运行"
                rm -f $PID_FILE
            fi
        else
            echo "监控进程未运行"
        fi
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

chmod +x tools/scripts/test-monitor-daemon.sh

# 创建日志目录
mkdir -p logs

echo "✅ 测试监控告警设置完成！"
echo ""
echo "📋 可用命令："
echo "  启动监控: ./tools/scripts/test-monitor-daemon.sh start"
echo "  停止监控: ./tools/scripts/test-monitor-daemon.sh stop"
echo "  重启监控: ./tools/scripts/test-monitor-daemon.sh restart"
echo "  查看状态: ./tools/scripts/test-monitor-daemon.sh status"
echo "  健康检查: ./tools/scripts/test-health-check.sh"
echo ""
echo "📁 配置文件："
echo "  监控配置: tools/monitoring/test-monitoring.yml"
echo "  日志文件: logs/test-monitor.log"
echo "  失败日志: logs/test-failures.log"
echo ""
echo "🔧 环境变量："
echo "  SLACK_WEBHOOK_URL: Slack webhook URL"
echo "  WEBHOOK_URL: 自定义webhook URL"
echo "  SMTP_PASSWORD: SMTP密码"
