"""
PredictionEngine主程序
基于统一开发文档v9.5的技术方案

功能:
- 整合三层模型
- 提供统一的预测接口
- 支持训练和预测模式
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from layer1_lightgbm import Layer1LightGBM, create_layer1_config
from layer2_finbert import Layer2FinBERT, create_layer2_config
from layer3_llama3 import Layer3Llama3, create_layer3_config


class PredictionEngineMain:
    """预测引擎主类"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_config = config.get("database", {})
        self.logger = self._setup_logging()

        # 初始化三层模型
        self.layer1 = Layer1LightGBM(create_layer1_config())
        self.layer2 = Layer2FinBERT(create_layer2_config())
        self.layer3 = Layer3Llama3(create_layer3_config())

        # 数据库连接
        self.db_connection = None

    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler("prediction_engine.log"),
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

    def load_training_data(self, start_date: str, end_date: str) -> pd.DataFrame:
        """加载训练数据"""
        try:
            query = """
            SELECT
                sample_id,
                anomaly_date,
                target_code,
                target_name,
                target_level,
                z_score_price,
                z_score_relative,
                volume_percentile,
                price_change_1d,
                price_change_5d,
                price_change_20d,
                pe_ttm,
                pb_ratio,
                market_cap,
                rsi_14,
                macd_signal,
                bollinger_position,
                turnover_rate,
                amplitude,
                volume_ratio,
                news_titles,
                announcement_titles,
                market_context,
                future_return_5d,
                future_return_10d,
                future_return_20d
            FROM prediction_training_samples
            WHERE anomaly_date BETWEEN %s AND %s
            AND is_validated = true
            ORDER BY anomaly_date, target_code
            """

            df = pd.read_sql_query(
                query, self.db_connection, params=[start_date, end_date]
            )

            self.logger.info(f"Loaded {len(df)} training samples")
            return df

        except Exception as e:
            self.logger.error(f"Error loading training data: {e}")
            raise

    def load_feature_data(
        self, trade_date: str, target_codes: List[str] = None
    ) -> pd.DataFrame:
        """加载特征数据"""
        try:
            # 构建查询条件
            where_clause = "WHERE trade_date = %s"
            params = [trade_date]

            if target_codes:
                placeholders = ",".join(["%s"] * len(target_codes))
                where_clause += f" AND target_code IN ({placeholders})"
                params.extend(target_codes)

            query = f"""
            SELECT
                target_code,
                target_name,
                return_zscore_60d,
                volume_zscore_60d,
                price_change_1d,
                price_change_5d,
                price_change_20d,
                pe_ttm,
                pb_ratio,
                market_cap,
                rsi_14,
                macd_signal,
                bollinger_position,
                turnover_rate,
                amplitude,
                volume_ratio
            FROM processed_events pe
            JOIN stock_basic_info sbi ON pe.target_code = sbi.ts_code
            {where_clause}
            """

            df = pd.read_sql_query(query, self.db_connection, params=params)
            self.logger.info(
                f"Loaded feature data for {len(df)} stocks on {trade_date}"
            )
            return df

        except Exception as e:
            self.logger.error(f"Error loading feature data: {e}")
            raise

    def load_text_data(
        self, trade_date: str, target_codes: List[str] = None
    ) -> pd.DataFrame:
        """加载文本数据"""
        try:
            # 构建查询条件
            where_clause = "WHERE DATE(published_at) = %s"
            params = [trade_date]

            if target_codes:
                placeholders = ",".join(["%s"] * len(target_codes))
                where_clause += f" AND target_code IN ({placeholders})"
                params.extend(target_codes)

            query = f"""
            SELECT
                target_code,
                ARRAY_AGG(DISTINCT title) as news_titles,
                ARRAY_AGG(DISTINCT content) as news_content
            FROM processed_events
            {where_clause}
            AND event_source = 'news'
            GROUP BY target_code
            """

            df = pd.read_sql_query(query, self.db_connection, params=params)
            self.logger.info(f"Loaded text data for {len(df)} stocks on {trade_date}")
            return df

        except Exception as e:
            self.logger.error(f"Error loading text data: {e}")
            raise

    def train_models(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """训练所有模型"""
        try:
            self.logger.info(f"Starting model training from {start_date} to {end_date}")

            # 加载训练数据
            training_data = self.load_training_data(start_date, end_date)

            if len(training_data) == 0:
                raise ValueError("No training data found")

            # 准备特征数据
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

            X = training_data[feature_columns].fillna(0)
            y = training_data["future_return_5d"].fillna(0)

            # 准备文本数据
            texts = []
            for _, row in training_data.iterrows():
                # 合并新闻标题
                news_titles = row.get("news_titles", []) or []
                announcement_titles = row.get("announcement_titles", []) or []
                all_titles = news_titles + announcement_titles
                text = " ".join(all_titles) if all_titles else ""
                texts.append(text)

            # 创建情感标签（简化版本）
            y_sentiment = np.where(y > 0.02, 1, np.where(y < -0.02, -1, 0))

            # 训练基础层模型
            self.logger.info("Training Layer 1 (LightGBM)...")
            layer1_performance = self.layer1.train(X, y)

            # 训练增强层模型
            self.logger.info("Training Layer 2 (FinBERT)...")
            layer2_performance = self.layer2.train(texts, y_sentiment)

            # 准备决策层训练数据
            layer3_training_data = []
            for i, (_, row) in enumerate(training_data.iterrows()):
                p1_pred = self.layer1.predict(X.iloc[[i]])[0]
                p2_pred = self.layer2.predict([texts[i]])[0]

                layer3_training_data.append(
                    {
                        "stock_code": row["target_code"],
                        "stock_name": row["target_name"],
                        "trade_date": str(row["anomaly_date"]),
                        "p1_prediction": p1_pred,
                        "p2_prediction": p2_pred,
                        "news_summary": texts[i][:200],  # 截取前200字符
                        "market_context": "historical_training",
                        "target_return": row["future_return_5d"],
                    }
                )

            # 训练决策层模型
            self.logger.info("Training Layer 3 (Llama 3)...")
            layer3_performance = self.layer3.train(layer3_training_data)

            # 保存模型
            layer1_path = self.layer1.save_model()
            layer2_path = self.layer2.save_model()
            layer3_path = self.layer3.save_model()

            # 保存到模型注册表
            self._save_to_model_registry(
                layer1_path,
                layer2_path,
                layer3_path,
                {
                    "layer1": layer1_performance,
                    "layer2": layer2_performance,
                    "layer3": layer3_performance,
                },
            )

            training_results = {
                "layer1_performance": layer1_performance,
                "layer2_performance": layer2_performance,
                "layer3_performance": layer3_performance,
                "layer1_path": layer1_path,
                "layer2_path": layer2_path,
                "layer3_path": layer3_path,
                "training_samples": len(training_data),
            }

            self.logger.info("Model training completed successfully")
            return training_results

        except Exception as e:
            self.logger.error(f"Error training models: {e}")
            raise

    def generate_predictions(
        self, trade_date: str, target_codes: List[str] = None
    ) -> List[Dict[str, Any]]:
        """生成预测"""
        try:
            self.logger.info(f"Generating predictions for {trade_date}")

            # 加载特征数据
            feature_data = self.load_feature_data(trade_date, target_codes)
            if len(feature_data) == 0:
                self.logger.warning(f"No feature data found for {trade_date}")
                return []

            # 加载文本数据
            text_data = self.load_text_data(trade_date, target_codes)

            predictions = []

            for _, row in feature_data.iterrows():
                try:
                    stock_code = row["target_code"]
                    stock_name = row["target_name"]

                    # 准备特征
                    feature_columns = [
                        "return_zscore_60d",
                        "volume_zscore_60d",
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

                    features = row[feature_columns].fillna(0).values.reshape(1, -1)
                    features_df = pd.DataFrame(features, columns=feature_columns)

                    # 基础层预测
                    p1 = self.layer1.predict(features_df)[0]

                    # 增强层预测
                    text_row = text_data[text_data["target_code"] == stock_code]
                    if len(text_row) > 0:
                        news_titles = text_row.iloc[0]["news_titles"] or []
                        news_content = text_row.iloc[0]["news_content"] or []
                        all_texts = news_titles + news_content
                        text_input = " ".join(all_texts[:5])  # 取前5条
                    else:
                        text_input = ""

                    p2 = self.layer2.predict([text_input])[0] if text_input else 0.0

                    # 决策层预测
                    p_final = self.layer3.predict(
                        stock_code=stock_code,
                        stock_name=stock_name,
                        trade_date=trade_date,
                        p1_prediction=p1,
                        p2_prediction=p2,
                        news_summary=text_input[:200],
                        market_context="market_analysis",
                    )

                    # 计算置信度
                    confidence = self._calculate_confidence(p1, p2, p_final)

                    prediction = {
                        "prediction_id": f"pred_{stock_code}_{trade_date.replace('-', '')}_{int(datetime.now().timestamp())}",
                        "trade_date": trade_date,
                        "target_code": stock_code,
                        "target_name": stock_name,
                        "p1_tabular_prediction": float(p1),
                        "p2_text_prediction": float(p2),
                        "p_final_prediction": float(p_final),
                        "confidence_score": float(confidence),
                        "model_version": "v1.0.0",
                        "created_at": datetime.now(),
                    }

                    predictions.append(prediction)

                except Exception as e:
                    self.logger.error(f"Error predicting for {stock_code}: {e}")
                    continue

            # 保存预测结果
            self._save_predictions(predictions)

            self.logger.info(
                f"Generated {len(predictions)} predictions for {trade_date}"
            )
            return predictions

        except Exception as e:
            self.logger.error(f"Error generating predictions: {e}")
            raise

    def _calculate_confidence(self, p1: float, p2: float, p_final: float) -> float:
        """计算置信度"""
        try:
            # 基于预测一致性计算置信度
            consistency = 1 - abs(p1 - p2) / (abs(p1) + abs(p2) + 1e-8)
            magnitude = min(abs(p_final) * 10, 1.0)  # 预测幅度
            confidence = (consistency + magnitude) / 2
            return max(0.0, min(1.0, confidence))
        except:
            return 0.5

    def _save_predictions(self, predictions: List[Dict[str, Any]]) -> None:
        """保存预测结果到数据库"""
        try:
            if not predictions:
                return

            cursor = self.db_connection.cursor()

            insert_query = """
            INSERT INTO daily_predictions (
                prediction_id, trade_date, target_code, target_name,
                p1_tabular_prediction, p2_text_prediction, p_final_prediction,
                confidence_score, model_version, created_at
            ) VALUES (
                %(prediction_id)s, %(trade_date)s, %(target_code)s, %(target_name)s,
                %(p1_tabular_prediction)s, %(p2_text_prediction)s, %(p_final_prediction)s,
                %(confidence_score)s, %(model_version)s, %(created_at)s
            ) ON CONFLICT (trade_date, target_code) DO UPDATE SET
                p1_tabular_prediction = EXCLUDED.p1_tabular_prediction,
                p2_text_prediction = EXCLUDED.p2_text_prediction,
                p_final_prediction = EXCLUDED.p_final_prediction,
                confidence_score = EXCLUDED.confidence_score,
                model_version = EXCLUDED.model_version,
                updated_at = CURRENT_TIMESTAMP
            """

            cursor.executemany(insert_query, predictions)
            self.db_connection.commit()
            cursor.close()

            self.logger.info(f"Saved {len(predictions)} predictions to database")

        except Exception as e:
            self.logger.error(f"Error saving predictions: {e}")
            raise

    def _save_to_model_registry(
        self,
        layer1_path: str,
        layer2_path: str,
        layer3_path: str,
        performance: Dict[str, Any],
    ) -> None:
        """保存模型到注册表"""
        try:
            cursor = self.db_connection.cursor()

            models = [
                (
                    "PredictionEngine_LightGBM",
                    "LAYER1",
                    layer1_path,
                    performance["layer1"],
                ),
                (
                    "PredictionEngine_FinBERT",
                    "LAYER2",
                    layer2_path,
                    performance["layer2"],
                ),
                (
                    "PredictionEngine_Llama3",
                    "LAYER3",
                    layer3_path,
                    performance["layer3"],
                ),
            ]

            for model_name, model_type, model_path, perf in models:
                insert_query = """
                INSERT INTO model_registry (
                    model_name, model_type, version, artifact_path,
                    performance_metrics, is_in_production, created_by
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                )
                """

                cursor.execute(
                    insert_query,
                    (
                        model_name,
                        model_type,
                        "v1.0.0",
                        model_path,
                        json.dumps(perf),
                        True,
                        "prediction_engine",
                    ),
                )

            self.db_connection.commit()
            cursor.close()

            self.logger.info("Models saved to registry")

        except Exception as e:
            self.logger.error(f"Error saving to model registry: {e}")
            raise

    def close(self) -> None:
        """关闭数据库连接"""
        if self.db_connection:
            self.db_connection.close()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="PredictionEngine Main Program")
    parser.add_argument(
        "--mode", choices=["train", "predict"], required=True, help="运行模式"
    )
    parser.add_argument("--start-date", help="开始日期 (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="结束日期 (YYYY-MM-DD)")
    parser.add_argument("--trade-date", help="交易日期 (YYYY-MM-DD)")
    parser.add_argument("--target-codes", nargs="+", help="目标股票代码列表")
    parser.add_argument("--config", default="config.json", help="配置文件路径")

    args = parser.parse_args()

    # 加载配置
    try:
        with open(args.config) as f:
            config = json.load(f)
    except FileNotFoundError:
        # 使用默认配置
        config = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "database": "news_analysis",
                "user": "postgres",
                "password": "",
            }
        }

    # 创建预测引擎
    engine = PredictionEngineMain(config)

    try:
        # 连接数据库
        engine.connect_database()

        if args.mode == "train":
            if not args.start_date or not args.end_date:
                print("训练模式需要指定 --start-date 和 --end-date")
                return

            # 训练模型
            results = engine.train_models(args.start_date, args.end_date)
            print(f"训练完成: {json.dumps(results, indent=2, ensure_ascii=False)}")

        elif args.mode == "predict":
            if not args.trade_date:
                print("预测模式需要指定 --trade-date")
                return

            # 生成预测
            predictions = engine.generate_predictions(
                args.trade_date, args.target_codes
            )
            print(f"生成了 {len(predictions)} 个预测结果")

            # 显示前5个预测结果
            for pred in predictions[:5]:
                print(
                    f"{pred['target_code']}: {pred['p_final_prediction']:.4f} (置信度: {pred['confidence_score']:.2f})"
                )

    finally:
        engine.close()


if __name__ == "__main__":
    main()
