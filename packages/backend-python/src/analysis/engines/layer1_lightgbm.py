"""
PredictionEngine Layer 1 - LightGBM基础层模型
基于统一开发文档v9.5的技术方案

功能:
- 处理结构化表格数据
- 使用LightGBM进行回归预测
- 输出初步预测结果P1
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, r2_score


class Layer1LightGBM:
    """LightGBM基础层模型"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.feature_importance = None
        self.scaler = None
        self.feature_columns = config.get("feature_columns", [])
        self.model_path = config.get("model_path", "./models/layer1_lightgbm")
        self.logger = logging.getLogger(__name__)

        # LightGBM参数
        self.lgb_params = {
            "objective": config.get("objective", "regression_l1"),
            "metric": config.get("metric", "mse"),
            "n_estimators": config.get("n_estimators", 1000),
            "learning_rate": config.get("learning_rate", 0.05),
            "num_leaves": config.get("num_leaves", 31),
            "feature_fraction": config.get("feature_fraction", 0.8),
            "bagging_fraction": config.get("bagging_fraction", 0.8),
            "bagging_freq": config.get("bagging_freq", 1),
            "verbose": -1,
            "random_state": 42,
        }

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """准备特征数据"""
        try:
            # 选择特征列
            feature_df = df[self.feature_columns].copy()

            # 处理缺失值
            feature_df = feature_df.fillna(feature_df.median())

            # 处理无穷值
            feature_df = feature_df.replace([np.inf, -np.inf], np.nan)
            feature_df = feature_df.fillna(feature_df.median())

            # 特征工程
            feature_df = self._engineer_features(feature_df)

            return feature_df

        except Exception as e:
            self.logger.error(f"Error preparing features: {e}")
            raise

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """特征工程"""
        try:
            # 创建衍生特征
            if "price_change_1d" in df.columns and "price_change_5d" in df.columns:
                df["momentum_ratio"] = df["price_change_1d"] / (
                    df["price_change_5d"] + 1e-8
                )

            if "volume_ratio" in df.columns and "turnover_rate" in df.columns:
                df["volume_turnover_ratio"] = df["volume_ratio"] / (
                    df["turnover_rate"] + 1e-8
                )

            if "rsi_14" in df.columns:
                df["rsi_signal"] = np.where(
                    df["rsi_14"] > 70, 1, np.where(df["rsi_14"] < 30, -1, 0)
                )

            if "macd_signal" in df.columns:
                df["macd_signal_binary"] = np.where(df["macd_signal"] > 0, 1, 0)

            # 技术指标组合
            if all(
                col in df.columns
                for col in ["rsi_14", "macd_signal", "bollinger_position"]
            ):
                df["technical_score"] = (
                    (df["rsi_14"] - 50) / 50 * 0.3
                    + df["macd_signal"] * 0.4
                    + (df["bollinger_position"] - 0.5) * 0.3
                )

            return df

        except Exception as e:
            self.logger.error(f"Error in feature engineering: {e}")
            return df

    def train(
        self, X: pd.DataFrame, y: pd.Series, validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """训练模型"""
        try:
            self.logger.info(f"Training LightGBM model with {len(X)} samples")

            # 准备特征
            X_processed = self.prepare_features(X)

            # 时序分割
            split_point = int(len(X_processed) * (1 - validation_split))
            X_train, X_val = X_processed[:split_point], X_processed[split_point:]
            y_train, y_val = y[:split_point], y[split_point:]

            # 创建LightGBM数据集
            train_data = lgb.Dataset(X_train, label=y_train)
            val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

            # 训练模型
            self.model = lgb.train(
                self.lgb_params,
                train_data,
                valid_sets=[train_data, val_data],
                valid_names=["train", "val"],
                num_boost_round=self.lgb_params["n_estimators"],
                callbacks=[lgb.early_stopping(100), lgb.log_evaluation(100)],
            )

            # 获取特征重要性
            self.feature_importance = dict(
                zip(X_processed.columns, self.model.feature_importance())
            )

            # 验证性能
            train_pred = self.model.predict(X_train)
            val_pred = self.model.predict(X_val)

            train_mse = mean_squared_error(y_train, train_pred)
            val_mse = mean_squared_error(y_val, val_pred)
            train_r2 = r2_score(y_train, train_pred)
            val_r2 = r2_score(y_val, val_pred)

            # 计算信息系数
            train_ic = np.corrcoef(y_train, train_pred)[0, 1]
            val_ic = np.corrcoef(y_val, val_pred)[0, 1]

            performance = {
                "train_mse": train_mse,
                "val_mse": val_mse,
                "train_r2": train_r2,
                "val_r2": val_r2,
                "train_ic": train_ic,
                "val_ic": val_ic,
                "feature_importance": self.feature_importance,
            }

            self.logger.info(
                f"Training completed. Val MSE: {val_mse:.4f}, Val R2: {val_r2:.4f}, Val IC: {val_ic:.4f}"
            )

            return performance

        except Exception as e:
            self.logger.error(f"Error training model: {e}")
            raise

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """预测"""
        try:
            if self.model is None:
                raise ValueError("Model not trained yet")

            # 准备特征
            X_processed = self.prepare_features(X)

            # 预测
            predictions = self.model.predict(X_processed)

            return predictions

        except Exception as e:
            self.logger.error(f"Error making predictions: {e}")
            raise

    def save_model(self, version: str = None) -> str:
        """保存模型"""
        try:
            if self.model is None:
                raise ValueError("Model not trained yet")

            if version is None:
                version = datetime.now().strftime("%Y%m%d_%H%M%S")

            # 创建模型目录
            model_dir = f"{self.model_path}_v{version}"
            os.makedirs(model_dir, exist_ok=True)

            # 保存模型
            model_file = os.path.join(model_dir, "model.pkl")
            joblib.dump(self.model, model_file)

            # 保存特征重要性
            importance_file = os.path.join(model_dir, "feature_importance.json")
            with open(importance_file, "w") as f:
                json.dump(self.feature_importance, f, indent=2)

            # 保存配置
            config_file = os.path.join(model_dir, "config.json")
            with open(config_file, "w") as f:
                json.dump(self.config, f, indent=2)

            self.logger.info(f"Model saved to {model_dir}")
            return model_dir

        except Exception as e:
            self.logger.error(f"Error saving model: {e}")
            raise

    def load_model(self, model_path: str) -> None:
        """加载模型"""
        try:
            model_file = os.path.join(model_path, "model.pkl")
            if not os.path.exists(model_file):
                raise FileNotFoundError(f"Model file not found: {model_file}")

            self.model = joblib.load(model_file)

            # 加载特征重要性
            importance_file = os.path.join(model_path, "feature_importance.json")
            if os.path.exists(importance_file):
                with open(importance_file) as f:
                    self.feature_importance = json.load(f)

            self.logger.info(f"Model loaded from {model_path}")

        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            raise

    def get_feature_importance(self, top_n: int = 20) -> Dict[str, float]:
        """获取特征重要性"""
        if self.feature_importance is None:
            return {}

        # 按重要性排序
        sorted_features = sorted(
            self.feature_importance.items(), key=lambda x: x[1], reverse=True
        )

        return dict(sorted_features[:top_n])

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """评估模型性能"""
        try:
            predictions = self.predict(X)

            mse = mean_squared_error(y, predictions)
            r2 = r2_score(y, predictions)
            ic = np.corrcoef(y, predictions)[0, 1]

            # 计算信息比率
            ic_std = np.std(ic) if hasattr(ic, "__len__") else 0
            ic_ir = ic / ic_std if ic_std > 0 else 0

            return {
                "mse": mse,
                "r2": r2,
                "ic": ic,
                "ic_ir": ic_ir,
                "mae": np.mean(np.abs(y - predictions)),
            }

        except Exception as e:
            self.logger.error(f"Error evaluating model: {e}")
            raise


def create_layer1_config() -> Dict[str, Any]:
    """创建Layer1配置"""
    return {
        "objective": "regression_l1",
        "metric": "mse",
        "n_estimators": 1000,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 1,
        "feature_columns": [
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
        ],
        "model_path": "./models/layer1_lightgbm",
    }


if __name__ == "__main__":
    # 示例使用
    config = create_layer1_config()
    model = Layer1LightGBM(config)

    # 这里可以添加训练和预测的示例代码
    print("Layer1 LightGBM model initialized successfully")
