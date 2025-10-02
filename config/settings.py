"""
配置管理 - 系统唯一的配置事实来源
遵循《测试宪法》第2.0条：当简单方案能解决90%问题时，复杂方案就是技术债
"""

import os


class Settings:
    """应用程序配置类 - 唯一事实来源"""

    def __init__(self):
        """从环境变量和.env文件加载配置"""
        # 基础配置
        self.APP_NAME = os.getenv("APP_NAME", "量化导航仪")
        self.APP_VERSION = os.getenv("APP_VERSION", "v15.0")
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

        # 数据库配置
        self.DATABASE_URL = os.getenv(
            "DATABASE_URL",
            "postgresql://user:password@localhost:5432/quantitative_navigator",
        )
        self.DATABASE_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"

        # Redis配置
        self.REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        # LLM API配置 - 核心工作流保障
        self.QWEN_API_KEY = os.getenv("QWEN_API_KEY")
        self.QWEN_BASE_URL = os.getenv(
            "QWEN_BASE_URL", "https://dashscope.aliyuncs.com/api/v1"
        )
        self.QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen-turbo")

        self.DOUBAO_API_KEY = os.getenv("DOUBAO_API_KEY")
        self.DOUBAO_BASE_URL = os.getenv(
            "DOUBAO_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3"
        )
        self.DOUBAO_MODEL = os.getenv("DOUBAO_MODEL", "doubao-pro")

        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        self.OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")

        # 数据源配置
        self.TUSHARE_TOKEN = os.getenv("TUSHARE_TOKEN")
        self.TUSHARE_BASE_URL = os.getenv("TUSHARE_BASE_URL", "http://api.tushare.pro")

        # 安全配置
        self.SECRET_KEY = os.getenv(
            "SECRET_KEY", "your-secret-key-change-in-production"
        )
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )

        # 允许的主机
        self.ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

        # 量化引擎配置
        self.Z_SCORE_THRESHOLD = float(os.getenv("Z_SCORE_THRESHOLD", "2.5"))
        self.ROLLING_WINDOW_SIZE = int(os.getenv("ROLLING_WINDOW_SIZE", "90"))
        self.MACRO_RISK_CALCULATION_ENABLED = (
            os.getenv("MACRO_RISK_CALCULATION_ENABLED", "true").lower() == "true"
        )
        self.STYLE_ROTATION_CALCULATION_ENABLED = (
            os.getenv("STYLE_ROTATION_CALCULATION_ENABLED", "true").lower() == "true"
        )

        # 异常检测配置
        self.ANOMALY_DETECTION_ENABLED = (
            os.getenv("ANOMALY_DETECTION_ENABLED", "true").lower() == "true"
        )
        self.ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "2.5"))
        self.ANOMALY_DETECTION_INTERVAL = int(
            os.getenv("ANOMALY_DETECTION_INTERVAL", "300000")
        )

        # 仲裁配置
        self.AUTO_ARBITRATION_THRESHOLD = float(
            os.getenv("AUTO_ARBITRATION_THRESHOLD", "0.8")
        )
        self.HUMAN_REVIEW_REQUIRED = (
            os.getenv("HUMAN_REVIEW_REQUIRED", "true").lower() == "true"
        )
        self.NOTIFICATION_ENABLED = (
            os.getenv("NOTIFICATION_ENABLED", "true").lower() == "true"
        )

        # 缓存配置
        self.CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))
        self.CACHE_MAX_SIZE = int(os.getenv("CACHE_MAX_SIZE", "1000"))

        # 日志配置
        self.LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "logs/app.log")


# 全局配置实例 - 系统唯一入口
settings = Settings()


def get_settings() -> Settings:
    """获取配置实例 - 用于依赖注入"""
    return settings


def validate_critical_config() -> bool:
    """验证关键配置是否完整 - 保障核心工作流"""
    critical_vars = ["QWEN_API_KEY", "DOUBAO_API_KEY", "DATABASE_URL", "TUSHARE_TOKEN"]

    missing_vars = []
    for var in critical_vars:
        if not getattr(settings, var, None):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ 关键配置缺失: {', '.join(missing_vars)}")
        print("💡 请设置环境变量或检查.env文件")
        return False

    print("✅ 关键配置验证通过")
    return True


if __name__ == "__main__":
    # 配置验证测试
    print("📋 当前配置:")
    print(f"  APP_NAME: {settings.APP_NAME}")
    print(f"  DEBUG: {settings.DEBUG}")
    print(f"  DATABASE_URL: {settings.DATABASE_URL}")
    print(f"  QWEN_API_KEY: {'已设置' if settings.QWEN_API_KEY else '未设置'}")
    print(f"  DOUBAO_API_KEY: {'已设置' if settings.DOUBAO_API_KEY else '未设置'}")

    # 验证关键配置
    validate_critical_config()
