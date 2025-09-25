/**
 * AlertNotifier - 告警通知服务
 * 支持邮件和钉钉Webhook通知
 */

import { Alert } from './SimpleMonitor';

export interface AlertingConfig {
  enabled: boolean;
  email: {
    enabled: boolean;
    smtp: string;
    port: number;
    user: string;
    password: string;
    to: string[];
  };
  dingtalk: {
    enabled: boolean;
    webhook: string;
    secret: string;
  };
}

export class AlertNotifier {
  private config: AlertingConfig;

  constructor(config: AlertingConfig) {
    this.config = config;
  }

  /**
   * 发送告警通知
   */
  public async sendAlert(alert: Alert): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // 发送邮件通知
      if (this.config.email.enabled) {
        await this.sendEmailAlert(alert);
      }

      // 发送钉钉通知
      if (this.config.dingtalk.enabled) {
        await this.sendDingtalkAlert(alert);
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * 发送邮件告警
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: this.config.email.smtp,
        port: this.config.email.port,
        secure: false,
        auth: {
          user: this.config.email.user,
          pass: this.config.email.password
        }
      });

      const mailOptions = {
        from: this.config.email.user,
        to: this.config.email.to.join(','),
        subject: `[${alert.severity.toUpperCase()}] ${alert.type} Alert - ${alert.service || 'System'}`,
        html: this.generateEmailContent(alert)
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email alert sent for ${alert.id}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * 发送钉钉告警
   */
  private async sendDingtalkAlert(alert: Alert): Promise<void> {
    try {
      const axios = require('axios');
      
      const message = {
        msgtype: 'text',
        text: {
          content: this.generateDingtalkContent(alert)
        }
      };

      await axios.post(this.config.dingtalk.webhook, message);
      console.log(`Dingtalk alert sent for ${alert.id}`);
    } catch (error) {
      console.error('Failed to send dingtalk alert:', error);
    }
  }

  /**
   * 生成邮件内容
   */
  private generateEmailContent(alert: Alert): string {
    const severityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
          <h1>🚨 ${alert.severity.toUpperCase()} ALERT</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2>Alert Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Alert ID</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Type</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Severity</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.severity}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Service</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.service || 'System'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Message</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.message}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Value</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.value}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Threshold</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${alert.threshold}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6; background-color: #e9ecef;"><strong>Timestamp</strong></td>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${new Date(alert.timestamp).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="padding: 20px; background-color: #ffffff;">
          <h3>Action Required</h3>
          <p>Please investigate and resolve this alert as soon as possible.</p>
          <p>If this alert is resolved, please update the system accordingly.</p>
        </div>
      </div>
    `;
  }

  /**
   * 生成钉钉内容
   */
  private generateDingtalkContent(alert: Alert): string {
    const severityEmojis = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    return `
🚨 ${severityEmojis[alert.severity]} ${alert.severity.toUpperCase()} ALERT

📋 Alert Details:
• ID: ${alert.id}
• Type: ${alert.type}
• Severity: ${alert.severity}
• Service: ${alert.service || 'System'}
• Message: ${alert.message}
• Value: ${alert.value}
• Threshold: ${alert.threshold}
• Time: ${new Date(alert.timestamp).toLocaleString()}

⚠️ Action Required: Please investigate and resolve this alert as soon as possible.
    `;
  }
}
