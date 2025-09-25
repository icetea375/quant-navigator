// API文档生成器
export const generateApiDocs = () => {
  const apiDocs = {
    version: '1.0.0',
    title: '量化导航仪 API 文档',
    description: '基于RESTful最佳实践的API服务文档',
    baseUrl: '/api/v1',
    endpoints: {
      public: {
        description: '公共API - 无需认证',
        basePath: '/public',
        endpoints: [
          {
            method: 'GET',
            path: '/market-briefing',
            description: '获取市场快报',
            parameters: [
              { name: 'date', type: 'string', required: false, description: '日期 (YYYY-MM-DD)' }
            ],
            response: {
              success: true,
              data: {
                title: 'string',
                content: 'string',
                publish_time: 'string'
              }
            }
          },
          {
            method: 'GET',
            path: '/hotspot-attribution',
            description: '获取热点复盘',
            parameters: [
              { name: 'date', type: 'string', required: false, description: '日期 (YYYY-MM-DD)' }
            ],
            response: {
              success: true,
              data: [
                {
                  hotspot_name: 'string',
                  summary: 'string',
                  snapshots: [
                    {
                      timestamp: 'string',
                      change_pct: 'number',
                      volume: 'number',
                      attribution: 'string'
                    }
                  ]
                }
              ]
            }
          }
        ]
      },
      private: {
        description: '私人API - 需要JWT认证',
        basePath: '/private',
        authentication: 'Bearer Token',
        endpoints: [
          {
            method: 'POST',
            path: '/auth/register',
            description: '用户注册',
            requestBody: {
              username: 'string',
              password: 'string',
              email: 'string (optional)'
            },
            response: {
              success: true,
              data: {
                user: {
                  id: 'string',
                  username: 'string',
                  email: 'string',
                  role: 'user | admin'
                },
                token: 'string'
              }
            }
          },
          {
            method: 'POST',
            path: '/auth/login',
            description: '用户登录',
            requestBody: {
              username: 'string',
              password: 'string'
            },
            response: {
              success: true,
              data: {
                user: {
                  id: 'string',
                  username: 'string',
                  email: 'string',
                  role: 'user | admin'
                },
                token: 'string'
              }
            }
          },
          {
            method: 'GET',
            path: '/stock-pools',
            description: '获取所有股票池',
            response: {
              success: true,
              data: [
                {
                  id: 'string',
                  name: 'string',
                  item_count: 'number',
                  items: [
                    {
                      id: 'string',
                      code: 'string',
                      name: 'string',
                      type: 'string'
                    }
                  ]
                }
              ]
            }
          },
          {
            method: 'POST',
            path: '/stock-pools',
            description: '创建股票池',
            requestBody: {
              name: 'string'
            },
            response: {
              success: true,
              data: {
                id: 'string',
                name: 'string',
                item_count: 'number'
              }
            }
          },
          {
            method: 'GET',
            path: '/stock-pools/:poolId',
            description: '获取单个股票池详情',
            parameters: [
              { name: 'poolId', type: 'string', required: true, description: '股票池ID' }
            ],
            response: {
              success: true,
              data: {
                id: 'string',
                name: 'string',
                items: [
                  {
                    id: 'string',
                    code: 'string',
                    name: 'string',
                    type: 'string'
                  }
                ]
              }
            }
          },
          {
            method: 'POST',
            path: '/stock-pools/:poolId/items',
            description: '添加股票池条目',
            parameters: [
              { name: 'poolId', type: 'string', required: true, description: '股票池ID' }
            ],
            requestBody: {
              code: 'string',
              name: 'string',
              type: 'string'
            },
            response: {
              success: true,
              data: {
                id: 'string',
                code: 'string',
                name: 'string',
                type: 'string'
              }
            }
          },
          {
            method: 'DELETE',
            path: '/stock-pools/items/:itemId',
            description: '删除股票池条目',
            parameters: [
              { name: 'itemId', type: 'string', required: true, description: '条目ID' }
            ],
            response: {
              success: true,
              data: {
                message: 'Item deleted successfully'
              }
            }
          },
          {
            method: 'GET',
            path: '/my-briefing',
            description: '获取专属盘前雷达',
            parameters: [
              { name: 'date', type: 'string', required: false, description: '日期 (YYYY-MM-DD)' }
            ],
            response: {
              success: true,
              data: {
                title: 'string',
                content: 'string',
                publish_time: 'string',
                personalized_insights: [
                  {
                    type: 'risk | opportunity | warning',
                    message: 'string',
                    confidence: 'number'
                  }
                ]
              }
            }
          },
          {
            method: 'GET',
            path: '/my-attribution',
            description: '获取持仓异动复盘',
            parameters: [
              { name: 'date', type: 'string', required: false, description: '日期 (YYYY-MM-DD)' }
            ],
            response: {
              success: true,
              data: [
                {
                  target_name: 'string',
                  change_pct: 'number',
                  snapshot: {
                    timestamp: 'string',
                    volume: 'number',
                    attribution: 'string',
                    confidence: 'number'
                  }
                }
              ]
            }
          }
        ]
      },
      admin: {
        description: '管理员API - 需要JWT认证 + Admin角色',
        basePath: '/admin',
        authentication: 'Bearer Token + Admin Role',
        endpoints: [
          {
            method: 'GET',
            path: '/system-status',
            description: '获取系统状态',
            response: {
              success: true,
              data: {
                data_pipeline_status: 'running | stopped | error',
                llm_service_health: 'healthy | degraded | down',
                db_connection: 'connected | disconnected',
                last_update: 'string',
                error_count: 'number',
                warning_count: 'number'
              }
            }
          },
          {
            method: 'GET',
            path: '/data-pipeline/logs',
            description: '获取数据管道日志',
            parameters: [
              { name: 'limit', type: 'number', required: false, description: '日志条数限制' },
              { name: 'level', type: 'string', required: false, description: '日志级别 (info|warn|error)' }
            ],
            response: {
              success: true,
              data: [
                {
                  timestamp: 'string',
                  level: 'info | warn | error',
                  message: 'string',
                  details: 'any'
                }
              ]
            }
          },
          {
            method: 'GET',
            path: '/ai-engine/stats',
            description: '获取AI引擎统计',
            response: {
              success: true,
              data: {
                total_requests: 'number',
                success_rate: 'number',
                p95_latency_ms: 'number',
                error_count: 'number',
                last_request_time: 'string'
              }
            }
          },
          {
            method: 'GET',
            path: '/config',
            description: '获取系统配置',
            response: {
              success: true,
              data: {
                z_score_threshold: 'number',
                update_frequency: 'string',
                max_concurrency: 'number',
                log_level: 'string'
              }
            }
          },
          {
            method: 'PATCH',
            path: '/config',
            description: '更新系统配置',
            requestBody: {
              z_score_threshold: 'number (optional)',
              update_frequency: 'string (optional)',
              max_concurrency: 'number (optional)',
              log_level: 'string (optional)'
            },
            response: {
              success: true,
              data: {
                z_score_threshold: 'number',
                update_frequency: 'string',
                max_concurrency: 'number',
                log_level: 'string'
              }
            }
          }
        ]
      }
    },
    errorResponses: [
      {
        status: 400,
        description: '请求参数错误',
        response: {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '请求参数错误'
          }
        }
      },
      {
        status: 401,
        description: '未授权访问',
        response: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未授权访问，请先登录'
          }
        }
      },
      {
        status: 403,
        description: '权限不足',
        response: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '权限不足，无法访问此资源'
          }
        }
      },
      {
        status: 404,
        description: '资源不存在',
        response: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '请求的资源不存在'
          }
        }
      },
      {
        status: 500,
        description: '服务器内部错误',
        response: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '服务器内部错误'
          }
        }
      }
    ]
  }

  return apiDocs
}

// 导出为JSON格式
export const exportApiDocsAsJson = () => {
  return JSON.stringify(generateApiDocs(), null, 2)
}

// 导出为Markdown格式
export const exportApiDocsAsMarkdown = () => {
  const docs = generateApiDocs()
  let markdown = `# ${docs.title}\n\n${docs.description}\n\n`

  // 添加版本信息
  markdown += `## 版本信息\n\n- 版本: ${docs.version}\n`
  markdown += `- 基础URL: ${docs.baseUrl}\n\n`

  // 添加公共API文档
  markdown += `## 公共API\n\n${docs.endpoints.public.description}\n\n`
  markdown += `**基础路径:** \`${docs.baseUrl}${docs.endpoints.public.basePath}\`\n\n`

  docs.endpoints.public.endpoints.forEach(endpoint => {
    markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `${endpoint.description}\n\n`
    
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += `**请求参数:**\n\n`
      endpoint.parameters.forEach(param => {
        markdown += `- \`${param.name}\` (${param.type})${param.required ? ' **必需**' : ' 可选'}: ${param.description}\n`
      })
      markdown += '\n'
    }

    if (endpoint.requestBody) {
      markdown += `**请求体:**\n\n\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`\n\n`
    }

    markdown += `**响应示例:**\n\n\`\`\`json\n${JSON.stringify(endpoint.response, null, 2)}\n\`\`\`\n\n`
  })

  // 添加私人API文档
  markdown += `## 私人API\n\n${docs.endpoints.private.description}\n\n`
  markdown += `**基础路径:** \`${docs.baseUrl}${docs.endpoints.private.basePath}\`\n`
  markdown += `**认证方式:** ${docs.endpoints.private.authentication}\n\n`

  docs.endpoints.private.endpoints.forEach(endpoint => {
    markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `${endpoint.description}\n\n`
    
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += `**请求参数:**\n\n`
      endpoint.parameters.forEach(param => {
        markdown += `- \`${param.name}\` (${param.type})${param.required ? ' **必需**' : ' 可选'}: ${param.description}\n`
      })
      markdown += '\n'
    }

    if (endpoint.requestBody) {
      markdown += `**请求体:**\n\n\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`\n\n`
    }

    markdown += `**响应示例:**\n\n\`\`\`json\n${JSON.stringify(endpoint.response, null, 2)}\n\`\`\`\n\n`
  })

  // 添加管理员API文档
  markdown += `## 管理员API\n\n${docs.endpoints.admin.description}\n\n`
  markdown += `**基础路径:** \`${docs.baseUrl}${docs.endpoints.admin.basePath}\`\n`
  markdown += `**认证方式:** ${docs.endpoints.admin.authentication}\n\n`

  docs.endpoints.admin.endpoints.forEach(endpoint => {
    markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `${endpoint.description}\n\n`
    
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += `**请求参数:**\n\n`
      endpoint.parameters.forEach(param => {
        markdown += `- \`${param.name}\` (${param.type})${param.required ? ' **必需**' : ' 可选'}: ${param.description}\n`
      })
      markdown += '\n'
    }

    if (endpoint.requestBody) {
      markdown += `**请求体:**\n\n\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`\n\n`
    }

    markdown += `**响应示例:**\n\n\`\`\`json\n${JSON.stringify(endpoint.response, null, 2)}\n\`\`\`\n\n`
  })

  // 添加错误响应文档
  markdown += `## 错误响应\n\n`
  docs.errorResponses.forEach(error => {
    markdown += `### ${error.status} ${error.description}\n\n`
    markdown += `\`\`\`json\n${JSON.stringify(error.response, null, 2)}\n\`\`\`\n\n`
  })

  return markdown
}

