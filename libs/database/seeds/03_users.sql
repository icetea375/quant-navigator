-- 用户管理种子数据脚本
-- 创建默认管理员用户和基础用户角色

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 插入默认管理员用户
-- 密码: admin123 (实际部署时应该使用环境变量)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@quant-navigator.com', '$2b$10$rQZ8K9vLxY2mN3pQ4rS5uO6vA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', '系统管理员', 'admin', true),
('arbitrator', 'arbitrator@quant-navigator.com', '$2b$10$rQZ8K9vLxY2mN3pQ4rS5uO6vA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', '仲裁员', 'arbitrator', true),
('analyst', 'analyst@quant-navigator.com', '$2b$10$rQZ8K9vLxY2mN3pQ4rS5uO6vA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', '分析师', 'analyst', true)
ON CONFLICT (username) DO NOTHING;
