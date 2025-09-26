"""
LearningLoopCoordinator - 学习循环协调器
基于统一开发文档v9.5的技术方案

功能:
- 在3年历史数据上执行完整的"预测→发现误差→归因误差→生成新知→驱动进化"学习循环
- 训练出经过千锤百炼的最终版预测引擎模型
- 建立不断扩充和丰富的特征库
"""

import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras
import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import sys
from dataclasses import dataclass

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from layer1_lightgbm import Layer1LightGBM, create_layer1_config
from layer2_finbert import Layer2FinBERT, create_layer2_config
from layer3_llama3 import Layer3Llama3, create_layer3_config


@dataclass
class LearningIteration:
    """学习迭代记录"""

    iteration_id: str
    start_date: str
    end_date: str
    training_samples: int
    validation_samples: int
    layer1_performance: Dict[str, float]
    layer2_performance: Dict[str, float]
    layer3_performance: Dict[str, float]
    overall_ic: float
    overall_sharpe: float
    feature_importance: Dict[str, float]
    created_at: datetime


class LearningLoopCoordinator:
    """学习循环协调器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_config = config.get("database", {})
        self.logger = self._setup_logging()

        # 学习循环参数
        self.retrain_frequency_days = config.get("retrain_frequency_days", 90)
        self.validation_split = config.get("validation_split", 0.2)
        self.min_training_samples = config.get("min_training_samples", 1000)
        self.performance_threshold = config.get("performance_threshold", 0.02)  # IC阈值

        # 数据库连接
        self.db_connection = None

        # 学习历史
        self.learning_history: List[LearningIteration] = []
        self.feature_evolution: Dict[str, List[float]] = {}

    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler("learning_loop_coordinator.log"),
                logging.StreamHandler(),
            ],
        )
        return logging.getLogger(__name__)

    def connect_database(self) -> None:
        """连接数据库"""
        try:
            self.db_connection = psycopg2.connect(
                host=self.db_config.get("host", "localhost"),
                port=self.db_config.get("port", 5432),
                database=self.db_config.get("database", "news_analysis"),
                user=self.db_config.get("user", "postgres"),
                password=self.db_config.get("password", ""),
            )
            self.logger.info("Database connected successfully")
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise

    def run_historical_loop(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """运行历史学习循环"""
        try:
            self.logger.info(
                f"Starting historical learning loop from {start_date} to {end_date}"
            )

            # 连接数据库
            self.connect_database()

            # 解析日期
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()

            # 初始化学习状态
            current_date = start_dt
            iteration_count = 0
            best_performance = -np.inf
            best_model_version = None

            # 主学习循环
            while current_date < end_dt:
                iteration_count += 1
                iteration_id = f"iter_{iteration_count:03d}"

                self.logger.info(
                    f"Starting iteration {iteration_count}: {current_date}"
                )

                # 计算训练和验证日期范围
                train_end_date = current_date + timedelta(
                    days=self.retrain_frequency_days
                )
                val_start_date = train_end_date + timedelta(days=1)
                val_end_date = min(val_start_date + timedelta(days=30), end_dt)

                if val_end_date <= val_start_date:
                    break

                # 执行单次学习迭代
                iteration_result = self._execute_learning_iteration(
                    iteration_id,
                    str(current_date),
                    str(train_end_date),
                    str(val_start_date),
                    str(val_end_date),
                )

                if iteration_result:
                    self.learning_history.append(iteration_result)

                    # 检查性能是否提升
                    if iteration_result.overall_ic > best_performance:
                        best_performance = iteration_result.overall_ic
                        best_model_version = iteration_id
                        self.logger.info(
                            f"New best performance: IC={best_performance:.4f}"
                        )

                    # 更新特征演化
                    self._update_feature_evolution(iteration_result)

                # 移动到下一个时间窗口
                current_date = val_end_date + timedelta(days=1)

            # 生成最终报告
            final_report = self._generate_final_report(best_model_version)

            self.logger.info(
                f"Historical learning loop completed. Total iterations: {iteration_count}"
            )
            return final_report

        except Exception as e:
            self.logger.error(f"Error in historical learning loop: {e}")
            raise
        finally:
            if self.db_connection:
                self.db_connection.close()

    def _execute_learning_iteration(
        self,
        iteration_id: str,
        train_start: str,
        train_end: str,
        val_start: str,
        val_end: str,
    ) -> Optional[LearningIteration]:
        """执行单次学习迭代"""
        try:
            # 1. 加载训练数据
            self.logger.info(f"Loading training data from {train_start} to {train_end}")
            train_data = self._load_training_data(train_start, train_end)

            if len(train_data) < self.min_training_samples:
                self.logger.warning(
                    f"Insufficient training data: {len(train_data)} < {self.min_training_samples}"
                )
                return None

            # 2. 加载验证数据
            self.logger.info(f"Loading validation data from {val_start} to {val_end}")
            val_data = self._load_validation_data(val_start, val_end)

            if len(val_data) < 100:
                self.logger.warning(f"Insufficient validation data: {len(val_data)}")
                return None

            # 3. 训练三层模型
            self.logger.info("Training three-layer models...")

            # 准备训练数据
            X_train, y_train, texts_train = self._prepare_training_data(train_data)
            X_val, y_val, texts_val = self._prepare_training_data(val_data)

            # 训练基础层
            layer1 = Layer1LightGBM(create_layer1_config())
            layer1_performance = layer1.train(X_train, y_train)

            # 训练增强层
            layer2 = Layer2FinBERT(create_layer2_config())
            y_sentiment_train = np.where(
                y_train > 0.02, 1, np.where(y_train < -0.02, -1, 0)
            )
            y_sentiment_val = np.where(y_val > 0.02, 1, np.where(y_val < -0.02, -1, 0))
            layer2_performance = layer2.train(texts_train, y_sentiment_train)

            # 训练决策层
            layer3_training_data = self._create_layer3_training_data(
                train_data, layer1, layer2, X_train, texts_train, y_train
            )
            layer3 = Layer3Llama3(create_layer3_config())
            layer3_performance = layer3.train(layer3_training_data)

            # 4. 验证模型性能
            self.logger.info("Validating model performance...")

            # 生成验证集预测
            val_predictions = []
            for i, (_, row) in enumerate(val_data.iterrows()):
                try:
                    # 基础层预测
                    features = X_val.iloc[[i]]
                    p1 = layer1.predict(features)[0]

                    # 增强层预测
                    text = texts_val[i] if i < len(texts_val) else ""
                    p2 = layer2.predict([text])[0] if text else 0.0

                    # 决策层预测
                    p_final = layer3.predict(
                        stock_code=row["target_code"],
                        stock_name=row["target_name"],
                        trade_date=str(row["anomaly_date"]),
                        p1_prediction=p1,
                        p2_prediction=p2,
                        news_summary=text[:200],
                        market_context="validation",
                    )

                    val_predictions.append(
                        {
                            "target_code": row["target_code"],
                            "actual_return": row["future_return_5d"],
                            "predicted_return": p_final,
                            "p1": p1,
                            "p2": p2,
                        }
                    )

                except Exception as e:
                    self.logger.error(f"Error in validation prediction: {e}")
                    continue

            # 计算性能指标
            if val_predictions:
                actual_returns = [p["actual_return"] for p in val_predictions]
                predicted_returns = [p["predicted_return"] for p in val_predictions]

                # 计算IC
                ic = np.corrcoef(actual_returns, predicted_returns)[0, 1]

                # 计算夏普比率
                returns = np.array(predicted_returns)
                sharpe = np.mean(returns) / (np.std(returns) + 1e-8)

                # 获取特征重要性
                feature_importance = layer1.get_feature_importance()

                # 创建迭代记录
                iteration = LearningIteration(
                    iteration_id=iteration_id,
                    start_date=train_start,
                    end_date=train_end,
                    training_samples=len(train_data),
                    validation_samples=len(val_predictions),
                    layer1_performance=layer1_performance,
                    layer2_performance=layer2_performance,
                    layer3_performance=layer3_performance,
                    overall_ic=ic,
                    overall_sharpe=sharpe,
                    feature_importance=feature_importance,
                    created_at=datetime.now(),
                )

                # 保存模型（如果性能足够好）
                if ic > self.performance_threshold:
                    self._save_iteration_models(iteration_id, layer1, layer2, layer3)

                self.logger.info(
                    f"Iteration {iteration_id} completed: IC={ic:.4f}, Sharpe={sharpe:.4f}"
                )
                return iteration

            return None

        except Exception as e:
            self.logger.error(f"Error in learning iteration {iteration_id}: {e}")
            return None

    def _load_training_data(self, start_date: str, end_date: str) -> pd.DataFrame:
        """加载训练数据"""
        query = """
        SELECT
            sample_id, anomaly_date, target_code, target_name, target_level,
            z_score_price, z_score_relative, volume_percentile,
            price_change_1d, price_change_5d, price_change_20d,
            pe_ttm, pb_ratio, market_cap, rsi_14, macd_signal,
            bollinger_position, turnover_rate, amplitude, volume_ratio,
            news_titles, announcement_titles, market_context,
            future_return_5d, future_return_10d, future_return_20d
        FROM prediction_training_samples
        WHERE anomaly_date BETWEEN %s AND %s
        AND is_validated = true
        ORDER BY anomaly_date, target_code
        """

        return pd.read_sql_query(
            query, self.db_connection, params=[start_date, end_date]
        )

    def _load_validation_data(self, start_date: str, end_date: str) -> pd.DataFrame:
        """加载验证数据"""
        return self._load_training_data(start_date, end_date)

    def _prepare_training_data(
        self, data: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """准备训练数据"""
        # 特征列
        feature_columns = [
            "z_score_price",
            "z_score_relative",
            "volume_percentile",
            "price_change_1d",
            "price_change_5d",
            "price_change_20d",
            "pe_ttm",
            "pb_ratio",
            "market_cap",
            "rsi_14",
            "macd_signal",
            "bollinger_position",
            "turnover_rate",
            "amplitude",
            "volume_ratio",
        ]

        X = data[feature_columns].fillna(0)
        y = data["future_return_5d"].fillna(0)

        # 文本数据
        texts = []
        for _, row in data.iterrows():
            news_titles = row.get("news_titles", []) or []
            announcement_titles = row.get("announcement_titles", []) or []
            all_titles = news_titles + announcement_titles
            text = " ".join(all_titles) if all_titles else ""
            texts.append(text)

        return X, y, texts

    def _create_layer3_training_data(
        self,
        data: pd.DataFrame,
        layer1: Layer1LightGBM,
        layer2: Layer2FinBERT,
        X: pd.DataFrame,
        texts: List[str],
        y: pd.Series,
    ) -> List[Dict[str, Any]]:
        """创建决策层训练数据"""
        training_data = []

        for i, (_, row) in enumerate(data.iterrows()):
            try:
                # 基础层预测
                features = X.iloc[[i]]
                p1_pred = layer1.predict(features)[0]

                # 增强层预测
                text = texts[i] if i < len(texts) else ""
                p2_pred = layer2.predict([text])[0] if text else 0.0

                training_data.append(
                    {
                        "stock_code": row["target_code"],
                        "stock_name": row["target_name"],
                        "trade_date": str(row["anomaly_date"]),
                        "p1_prediction": p1_pred,
                        "p2_prediction": p2_pred,
                        "news_summary": text[:200],
                        "market_context": row.get("market_context", ""),
                        "target_return": row["future_return_5d"],
                    }
                )

            except Exception as e:
                self.logger.error(f"Error creating layer3 training data: {e}")
                continue

        return training_data

    def _update_feature_evolution(self, iteration: LearningIteration) -> None:
        """更新特征演化"""
        for feature, importance in iteration.feature_importance.items():
            if feature not in self.feature_evolution:
                self.feature_evolution[feature] = []
            self.feature_evolution[feature].append(importance)

    def _save_iteration_models(
        self,
        iteration_id: str,
        layer1: Layer1LightGBM,
        layer2: Layer2FinBERT,
        layer3: Layer3Llama3,
    ) -> None:
        """保存迭代模型"""
        try:
            models_dir = f"./models/learning_iterations/{iteration_id}"
            os.makedirs(models_dir, exist_ok=True)

            # 保存各层模型
            layer1_path = layer1.save_model(iteration_id)
            layer2_path = layer2.save_model(iteration_id)
            layer3_path = layer3.save_model(iteration_id)

            # 保存迭代信息
            iteration_info = {
                "iteration_id": iteration_id,
                "layer1_path": layer1_path,
                "layer2_path": layer2_path,
                "layer3_path": layer3_path,
                "saved_at": datetime.now().isoformat(),
            }

            with open(f"{models_dir}/iteration_info.json", "w") as f:
                json.dump(iteration_info, f, indent=2)

            self.logger.info(f"Models saved for iteration {iteration_id}")

        except Exception as e:
            self.logger.error(f"Error saving iteration models: {e}")

    def _generate_final_report(self, best_model_version: str) -> Dict[str, Any]:
        """生成最终报告"""
        try:
            if not self.learning_history:
                return {"error": "No learning iterations completed"}

            # 计算统计信息
            total_iterations = len(self.learning_history)
            ic_values = [iter.overall_ic for iter in self.learning_history]
            sharpe_values = [iter.overall_sharpe for iter in self.learning_history]

            # 特征演化分析
            feature_evolution_summary = {}
            for feature, importance_history in self.feature_evolution.items():
                if len(importance_history) > 1:
                    feature_evolution_summary[feature] = {
                        "initial_importance": importance_history[0],
                        "final_importance": importance_history[-1],
                        "trend": "increasing"
                        if importance_history[-1] > importance_history[0]
                        else "decreasing",
                        "volatility": np.std(importance_history),
                    }

            # 性能趋势分析
            performance_trend = {
                "ic_trend": "improving"
                if ic_values[-1] > ic_values[0]
                else "declining",
                "sharpe_trend": "improving"
                if sharpe_values[-1] > sharpe_values[0]
                else "declining",
                "best_ic": max(ic_values),
                "best_sharpe": max(sharpe_values),
                "final_ic": ic_values[-1],
                "final_sharpe": sharpe_values[-1],
            }

            # 生成最终报告
            final_report = {
                "learning_summary": {
                    "total_iterations": total_iterations,
                    "best_model_version": best_model_version,
                    "performance_trend": performance_trend,
                    "learning_period": {
                        "start_date": self.learning_history[0].start_date,
                        "end_date": self.learning_history[-1].end_date,
                    },
                },
                "feature_evolution": feature_evolution_summary,
                "iteration_details": [
                    {
                        "iteration_id": iter.iteration_id,
                        "ic": iter.overall_ic,
                        "sharpe": iter.overall_sharpe,
                        "training_samples": iter.training_samples,
                        "validation_samples": iter.validation_samples,
                    }
                    for iter in self.learning_history
                ],
                "recommendations": self._generate_recommendations(
                    performance_trend, feature_evolution_summary
                ),
                "generated_at": datetime.now().isoformat(),
            }

            # 保存最终报告
            with open("learning_loop_final_report.json", "w") as f:
                json.dump(final_report, f, indent=2, ensure_ascii=False)

            self.logger.info("Final learning report generated")
            return final_report

        except Exception as e:
            self.logger.error(f"Error generating final report: {e}")
            return {"error": str(e)}

    def _generate_recommendations(
        self, performance_trend: Dict, feature_evolution: Dict
    ) -> List[str]:
        """生成改进建议"""
        recommendations = []

        # 性能建议
        if performance_trend["ic_trend"] == "declining":
            recommendations.append("模型性能呈下降趋势，建议增加训练数据或调整特征工程")

        if performance_trend["final_ic"] < 0.01:
            recommendations.append("最终IC值较低，建议重新审视模型架构和特征选择")

        # 特征建议
        important_features = [
            f for f, info in feature_evolution.items() if info["final_importance"] > 0.1
        ]
        if len(important_features) < 5:
            recommendations.append("重要特征数量较少，建议扩展特征工程")

        # 稳定性建议
        volatile_features = [
            f for f, info in feature_evolution.items() if info["volatility"] > 0.1
        ]
        if len(volatile_features) > 3:
            recommendations.append("部分特征重要性波动较大，建议增加数据稳定性")

        return recommendations


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="Learning Loop Coordinator")
    parser.add_argument("--start-date", required=True, help="开始日期 (YYYY-MM-DD)")
    parser.add_argument("--end-date", required=True, help="结束日期 (YYYY-MM-DD)")
    parser.add_argument(
        "--config", default="learning_loop_config.json", help="配置文件路径"
    )

    args = parser.parse_args()

    # 加载配置
    try:
        with open(args.config, "r") as f:
            config = json.load(f)
    except FileNotFoundError:
        # 使用默认配置
        config = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "database": "news_analysis",
                "user": "news_user",
                "password": "news_password",
            },
            "retrain_frequency_days": 90,
            "validation_split": 0.2,
            "min_training_samples": 1000,
            "performance_threshold": 0.02,
        }

    # 创建学习循环协调器
    coordinator = LearningLoopCoordinator(config)

    try:
        # 运行历史学习循环
        report = coordinator.run_historical_loop(args.start_date, args.end_date)
        print(
            f"Learning loop completed: {json.dumps(report, indent=2, ensure_ascii=False)}"
        )

    except Exception as e:
        print(f"Learning loop failed: {e}")


if __name__ == "__main__":
    main()
