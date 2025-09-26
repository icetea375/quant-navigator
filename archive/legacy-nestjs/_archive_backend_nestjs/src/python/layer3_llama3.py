"""
PredictionEngine Layer 3 - Llama 3决策层模型
基于统一开发文档v9.5的技术方案

功能:
- 综合基础层和增强层的预测结果
- 使用Llama 3进行最终决策
- 输出最终预测结果P_final
"""

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
import json
import os
import logging
from typing import Dict, List, Any
from datetime import datetime
import warnings

warnings.filterwarnings("ignore")


class Layer3Llama3:
    """Llama 3决策层模型"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = config.get("model_path", "./models/layer3_llama3")
        self.max_tokens = config.get("max_tokens", 1024)
        self.temperature = config.get("temperature", 0.7)
        self.logger = logging.getLogger(__name__)

        # 预测任务模板
        self.prediction_template = """你是一个首席投资官，请根据以下专家的意见和市场数据，预测该股未来5日的超额收益率。

股票: {stock_name} ({stock_code})
日期: {trade_date}

量化分析师意见(P1): {p1_prediction:.4f}
舆情分析师意见(P2): {p2_prediction:.4f}

关键新闻: {news_summary}
市场背景: {market_context}

请给出你的最终预测(格式: 数字，如0.0234表示2.34%的超额收益率):"""

        self.training_template = """<|begin_of_text|><|start_header_id|>user<|end_header_id|>

{instruction}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{output}<|eot_id|><|end_of_text|>"""

    def load_pretrained_model(
        self, model_name: str = "meta-llama/Llama-3-8B-Instruct"
    ) -> None:
        """加载预训练模型"""
        try:
            self.logger.info(f"Loading pretrained model: {model_name}")

            # 加载tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name, trust_remote_code=True
            )

            # 设置pad_token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            # 加载模型
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16
                if torch.cuda.is_available()
                else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True,
            )

            self.logger.info(f"Model loaded successfully on {self.device}")

        except Exception as e:
            self.logger.error(f"Error loading pretrained model: {e}")
            # 如果无法加载Llama 3，使用较小的模型作为备选
            self._load_fallback_model()

    def _load_fallback_model(self) -> None:
        """加载备选模型"""
        try:
            fallback_model = "microsoft/DialoGPT-medium"
            self.logger.info(f"Loading fallback model: {fallback_model}")

            self.tokenizer = AutoTokenizer.from_pretrained(fallback_model)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            self.model = AutoModelForCausalLM.from_pretrained(fallback_model)
            self.model.to(self.device)

        except Exception as e:
            self.logger.error(f"Error loading fallback model: {e}")
            raise

    def create_prediction_prompt(
        self,
        stock_code: str,
        stock_name: str,
        trade_date: str,
        p1_prediction: float,
        p2_prediction: float,
        news_summary: str = "",
        market_context: str = "",
    ) -> str:
        """创建预测提示词"""
        try:
            return self.prediction_template.format(
                stock_name=stock_name,
                stock_code=stock_code,
                trade_date=trade_date,
                p1_prediction=p1_prediction,
                p2_prediction=p2_prediction,
                news_summary=news_summary or "无重大新闻",
                market_context=market_context or "市场表现平稳",
            )
        except Exception as e:
            self.logger.error(f"Error creating prediction prompt: {e}")
            return ""

    def predict(
        self,
        stock_code: str,
        stock_name: str,
        trade_date: str,
        p1_prediction: float,
        p2_prediction: float,
        news_summary: str = "",
        market_context: str = "",
    ) -> float:
        """预测最终收益率"""
        try:
            if self.model is None or self.tokenizer is None:
                raise ValueError("Model not loaded yet")

            # 创建提示词
            prompt = self.create_prediction_prompt(
                stock_code,
                stock_name,
                trade_date,
                p1_prediction,
                p2_prediction,
                news_summary,
                market_context,
            )

            # Tokenize
            inputs = self.tokenizer(
                prompt, return_tensors="pt", truncation=True, max_length=self.max_tokens
            ).to(self.device)

            # 生成预测
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=50,
                    temperature=self.temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                )

            # 解码输出
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            # 提取预测数值
            prediction = self._extract_prediction_from_response(response)

            return prediction

        except Exception as e:
            self.logger.error(f"Error making prediction: {e}")
            # 返回简单加权平均作为备选
            return self._fallback_prediction(p1_prediction, p2_prediction)

    def _extract_prediction_from_response(self, response: str) -> float:
        """从响应中提取预测数值"""
        try:
            import re

            # 查找数字模式
            patterns = [
                r"(\d+\.?\d*)\s*%",  # 百分比格式
                r"(\d+\.?\d*)\s*超额收益率",  # 中文描述
                r"(\d+\.?\d*)\s*excess return",  # 英文描述
                r"(\d+\.?\d*)",  # 纯数字
            ]

            for pattern in patterns:
                matches = re.findall(pattern, response)
                if matches:
                    # 取最后一个匹配的数字
                    value = float(matches[-1])
                    # 如果是百分比，转换为小数
                    if "%" in response or "百分比" in response:
                        value = value / 100
                    return value

            # 如果没有找到数字，返回0
            return 0.0

        except Exception as e:
            self.logger.error(f"Error extracting prediction: {e}")
            return 0.0

    def _fallback_prediction(self, p1: float, p2: float) -> float:
        """备选预测方法"""
        # 简单的加权平均
        return 0.6 * p1 + 0.4 * p2

    def prepare_training_data(
        self, training_samples: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """准备训练数据"""
        try:
            training_data = []

            for sample in training_samples:
                # 创建指令
                instruction = self.create_prediction_prompt(
                    sample["stock_code"],
                    sample["stock_name"],
                    sample["trade_date"],
                    sample["p1_prediction"],
                    sample["p2_prediction"],
                    sample.get("news_summary", ""),
                    sample.get("market_context", ""),
                )

                # 创建输出
                output = f"{sample['target_return']:.4f}"

                # 创建训练样本
                training_text = self.training_template.format(
                    instruction=instruction, output=output
                )

                training_data.append(
                    {
                        "text": training_text,
                        "instruction": instruction,
                        "output": output,
                    }
                )

            return training_data

        except Exception as e:
            self.logger.error(f"Error preparing training data: {e}")
            raise

    def train(
        self, training_samples: List[Dict[str, Any]], validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """训练模型"""
        try:
            if self.model is None:
                self.load_pretrained_model()

            self.logger.info(
                f"Training Llama 3 model with {len(training_samples)} samples"
            )

            # 准备训练数据
            training_data = self.prepare_training_data(training_samples)

            # 分割训练和验证集
            split_point = int(len(training_data) * (1 - validation_split))
            train_data = training_data[:split_point]
            val_data = training_data[split_point:]

            # 创建数据集
            train_dataset = self._create_dataset(train_data)
            val_dataset = self._create_dataset(val_data)

            # 数据整理器
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer, mlm=False
            )

            # 训练参数
            training_args = TrainingArguments(
                output_dir=f"{self.model_path}_training",
                num_train_epochs=2,
                per_device_train_batch_size=1,  # 小批量，因为模型较大
                per_device_eval_batch_size=1,
                gradient_accumulation_steps=4,
                warmup_steps=100,
                weight_decay=0.01,
                logging_dir=f"{self.model_path}_logs",
                logging_steps=10,
                evaluation_strategy="steps",
                eval_steps=50,
                save_strategy="steps",
                save_steps=50,
                load_best_model_at_end=True,
                metric_for_best_model="eval_loss",
                greater_is_better=False,
                save_total_limit=2,
                report_to=None,
                fp16=torch.cuda.is_available(),
            )

            # 创建训练器
            trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=val_dataset,
                data_collator=data_collator,
            )

            # 训练
            trainer.train()

            # 评估
            eval_results = trainer.evaluate()

            performance = {
                "eval_loss": eval_results["eval_loss"],
                "train_samples": len(train_data),
                "val_samples": len(val_data),
            }

            self.logger.info(
                f"Training completed. Eval loss: {eval_results['eval_loss']:.4f}"
            )

            return performance

        except Exception as e:
            self.logger.error(f"Error training model: {e}")
            raise

    def _create_dataset(self, data: List[Dict[str, str]]) -> torch.utils.data.Dataset:
        """创建PyTorch数据集"""

        class TextDataset(torch.utils.data.Dataset):
            def __init__(self, texts, tokenizer, max_length=1024):
                self.texts = texts
                self.tokenizer = tokenizer
                self.max_length = max_length

            def __len__(self):
                return len(self.texts)

            def __getitem__(self, idx):
                text = self.texts[idx]["text"]
                encoding = self.tokenizer(
                    text,
                    truncation=True,
                    padding="max_length",
                    max_length=self.max_length,
                    return_tensors="pt",
                )
                return {
                    "input_ids": encoding["input_ids"].flatten(),
                    "attention_mask": encoding["attention_mask"].flatten(),
                    "labels": encoding["input_ids"].flatten(),
                }

        return TextDataset(
            [item["text"] for item in data], self.tokenizer, self.max_tokens
        )

    def save_model(self, version: str = None) -> str:
        """保存模型"""
        try:
            if self.model is None or self.tokenizer is None:
                raise ValueError("Model not trained yet")

            if version is None:
                version = datetime.now().strftime("%Y%m%d_%H%M%S")

            # 创建模型目录
            model_dir = f"{self.model_path}_v{version}"
            os.makedirs(model_dir, exist_ok=True)

            # 保存模型和tokenizer
            self.model.save_pretrained(model_dir)
            self.tokenizer.save_pretrained(model_dir)

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
            # 加载tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)

            # 加载模型
            self.model = AutoModelForCausalLM.from_pretrained(model_path)
            self.model.to(self.device)

            self.logger.info(f"Model loaded from {model_path}")

        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            raise


def create_layer3_config() -> Dict[str, Any]:
    """创建Layer3配置"""
    return {
        "model_path": "./models/layer3_llama3",
        "max_tokens": 1024,
        "temperature": 0.7,
        "pretrained_model": "meta-llama/Llama-3-8B-Instruct",
    }


def create_sample_training_data() -> List[Dict[str, Any]]:
    """创建示例训练数据"""
    return [
        {
            "stock_code": "000001.SZ",
            "stock_name": "平安银行",
            "trade_date": "2024-01-15",
            "p1_prediction": 0.0234,
            "p2_prediction": 0.0156,
            "news_summary": "银行板块整体上涨，政策利好",
            "market_context": "市场情绪乐观",
            "target_return": 0.0189,
        },
        {
            "stock_code": "600519.SH",
            "stock_name": "贵州茅台",
            "trade_date": "2024-01-15",
            "p1_prediction": -0.0123,
            "p2_prediction": -0.0089,
            "news_summary": "白酒板块调整，消费疲软",
            "market_context": "市场谨慎观望",
            "target_return": -0.0105,
        },
    ]


if __name__ == "__main__":
    # 示例使用
    config = create_layer3_config()
    model = Layer3Llama3(config)

    # 测试预测
    prediction = model.predict(
        stock_code="000001.SZ",
        stock_name="平安银行",
        trade_date="2024-01-15",
        p1_prediction=0.0234,
        p2_prediction=0.0156,
        news_summary="银行板块整体上涨",
        market_context="市场情绪乐观",
    )
    print(f"Prediction: {prediction}")
