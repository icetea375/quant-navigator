"""
PredictionEngine Layer 2 - FinBERT增强层模型
基于统一开发文档v9.5的技术方案

功能:
- 处理非结构化文本数据
- 使用FinBERT进行情感分析
- 输出情绪预测结果P2
"""

import pandas as pd
import numpy as np
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
import json
import os
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class Layer2FinBERT:
    """FinBERT增强层模型"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = config.get('model_path', './models/layer2_finbert')
        self.max_length = config.get('max_length', 512)
        self.batch_size = config.get('batch_size', 16)
        self.logger = logging.getLogger(__name__)
        
        # 情感标签映射
        self.label_map = {
            'negative': -1,
            'neutral': 0,
            'positive': 1
        }
        self.reverse_label_map = {v: k for k, v in self.label_map.items()}
    
    def load_pretrained_model(self, model_name: str = "yiyanghkust/finbert-tone") -> None:
        """加载预训练模型"""
        try:
            self.logger.info(f"Loading pretrained model: {model_name}")
            
            # 加载tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            # 加载模型
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=3,  # negative, neutral, positive
                problem_type="single_label_classification"
            )
            
            # 移动到设备
            self.model.to(self.device)
            
            self.logger.info(f"Model loaded successfully on {self.device}")
            
        except Exception as e:
            self.logger.error(f"Error loading pretrained model: {e}")
            raise
    
    def prepare_text_data(self, texts: List[str], labels: List[int] = None) -> Dict[str, Any]:
        """准备文本数据"""
        try:
            # 文本预处理
            processed_texts = []
            for text in texts:
                if isinstance(text, str) and len(text.strip()) > 0:
                    # 简单的文本清理
                    cleaned_text = self._clean_text(text)
                    processed_texts.append(cleaned_text)
                else:
                    processed_texts.append("")  # 空文本用空字符串代替
            
            # Tokenization
            encodings = self.tokenizer(
                processed_texts,
                truncation=True,
                padding=True,
                max_length=self.max_length,
                return_tensors='pt'
            )
            
            result = {
                'input_ids': encodings['input_ids'],
                'attention_mask': encodings['attention_mask']
            }
            
            if labels is not None:
                result['labels'] = torch.tensor(labels, dtype=torch.long)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error preparing text data: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """清理文本"""
        try:
            # 移除特殊字符但保留中文
            import re
            text = re.sub(r'[^\w\s\u4e00-\u9fff]', ' ', text)
            # 移除多余空格
            text = ' '.join(text.split())
            return text.strip()
        except:
            return text
    
    def create_dataset(self, texts: List[str], labels: List[int]) -> torch.utils.data.Dataset:
        """创建PyTorch数据集"""
        try:
            data = self.prepare_text_data(texts, labels)
            
            class TextDataset(torch.utils.data.Dataset):
                def __init__(self, input_ids, attention_mask, labels):
                    self.input_ids = input_ids
                    self.attention_mask = attention_mask
                    self.labels = labels
                
                def __len__(self):
                    return len(self.input_ids)
                
                def __getitem__(self, idx):
                    return {
                        'input_ids': self.input_ids[idx],
                        'attention_mask': self.attention_mask[idx],
                        'labels': self.labels[idx]
                    }
            
            return TextDataset(
                data['input_ids'],
                data['attention_mask'],
                data['labels']
            )
            
        except Exception as e:
            self.logger.error(f"Error creating dataset: {e}")
            raise
    
    def train(self, texts: List[str], labels: List[int], validation_split: float = 0.2) -> Dict[str, Any]:
        """训练模型"""
        try:
            if self.model is None:
                self.load_pretrained_model()
            
            self.logger.info(f"Training FinBERT model with {len(texts)} samples")
            
            # 创建数据集
            dataset = self.create_dataset(texts, labels)
            
            # 分割训练和验证集
            train_size = int(len(dataset) * (1 - validation_split))
            val_size = len(dataset) - train_size
            train_dataset, val_dataset = torch.utils.data.random_split(
                dataset, [train_size, val_size]
            )
            
            # 训练参数
            training_args = TrainingArguments(
                output_dir=f"{self.model_path}_training",
                num_train_epochs=3,
                per_device_train_batch_size=self.batch_size,
                per_device_eval_batch_size=self.batch_size,
                warmup_steps=500,
                weight_decay=0.01,
                logging_dir=f"{self.model_path}_logs",
                logging_steps=100,
                evaluation_strategy="steps",
                eval_steps=500,
                save_strategy="steps",
                save_steps=500,
                load_best_model_at_end=True,
                metric_for_best_model="eval_loss",
                greater_is_better=False,
                save_total_limit=2,
                report_to=None  # 禁用wandb
            )
            
            # 创建训练器
            trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=val_dataset,
                callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
            )
            
            # 训练
            trainer.train()
            
            # 评估
            eval_results = trainer.evaluate()
            
            # 预测验证集
            val_predictions = trainer.predict(val_dataset)
            val_pred_labels = np.argmax(val_predictions.predictions, axis=1)
            val_true_labels = [dataset[i]['labels'].item() for i in range(len(val_dataset))]
            
            # 计算指标
            accuracy = accuracy_score(val_true_labels, val_pred_labels)
            precision, recall, f1, _ = precision_recall_fscore_support(
                val_true_labels, val_pred_labels, average='weighted'
            )
            
            performance = {
                'eval_loss': eval_results['eval_loss'],
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1
            }
            
            self.logger.info(f"Training completed. Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
            
            return performance
            
        except Exception as e:
            self.logger.error(f"Error training model: {e}")
            raise
    
    def predict(self, texts: List[str]) -> np.ndarray:
        """预测文本情感"""
        try:
            if self.model is None:
                raise ValueError("Model not loaded yet")
            
            self.model.eval()
            
            # 准备数据
            data = self.prepare_text_data(texts)
            
            # 批量预测
            predictions = []
            with torch.no_grad():
                for i in range(0, len(texts), self.batch_size):
                    batch_input_ids = data['input_ids'][i:i+self.batch_size].to(self.device)
                    batch_attention_mask = data['attention_mask'][i:i+self.batch_size].to(self.device)
                    
                    outputs = self.model(
                        input_ids=batch_input_ids,
                        attention_mask=batch_attention_mask
                    )
                    
                    logits = outputs.logits
                    batch_predictions = torch.softmax(logits, dim=-1)
                    predictions.extend(batch_predictions.cpu().numpy())
            
            # 转换为情感分数 (-1, 0, 1)
            sentiment_scores = []
            for pred in predictions:
                # 使用加权平均计算情感分数
                score = (pred[2] - pred[0])  # positive - negative
                sentiment_scores.append(score)
            
            return np.array(sentiment_scores)
            
        except Exception as e:
            self.logger.error(f"Error making predictions: {e}")
            raise
    
    def predict_single(self, text: str) -> float:
        """预测单个文本的情感分数"""
        try:
            predictions = self.predict([text])
            return predictions[0]
        except Exception as e:
            self.logger.error(f"Error predicting single text: {e}")
            return 0.0
    
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
            with open(config_file, 'w') as f:
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
            self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            self.model.to(self.device)
            
            self.logger.info(f"Model loaded from {model_path}")
            
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            raise
    
    def evaluate(self, texts: List[str], labels: List[int]) -> Dict[str, float]:
        """评估模型性能"""
        try:
            predictions = self.predict(texts)
            
            # 将连续分数转换为离散标签
            pred_labels = np.where(predictions > 0.2, 1, 
                                 np.where(predictions < -0.2, -1, 0))
            
            accuracy = accuracy_score(labels, pred_labels)
            precision, recall, f1, _ = precision_recall_fscore_support(
                labels, pred_labels, average='weighted'
            )
            
            return {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'mean_sentiment_score': np.mean(predictions)
            }
            
        except Exception as e:
            self.logger.error(f"Error evaluating model: {e}")
            raise

def create_layer2_config() -> Dict[str, Any]:
    """创建Layer2配置"""
    return {
        'model_path': './models/layer2_finbert',
        'max_length': 512,
        'batch_size': 16,
        'pretrained_model': 'yiyanghkust/finbert-tone'
    }

def create_sample_training_data() -> Tuple[List[str], List[int]]:
    """创建示例训练数据"""
    texts = [
        "公司发布超预期财报，净利润增长30%",
        "股价大幅下跌，投资者担忧情绪加剧",
        "市场表现平稳，无明显波动",
        "重大利好消息公布，股价有望上涨",
        "业绩不及预期，投资者信心不足",
        "技术突破获得重大进展",
        "监管政策收紧，行业前景不明",
        "与知名企业达成战略合作",
        "产品召回事件影响公司声誉",
        "市场环境良好，发展前景乐观"
    ]
    
    labels = [1, -1, 0, 1, -1, 1, -1, 1, -1, 1]  # positive, negative, neutral
    
    return texts, labels

if __name__ == "__main__":
    # 示例使用
    config = create_layer2_config()
    model = Layer2FinBERT(config)
    
    # 创建示例数据
    texts, labels = create_sample_training_data()
    
    # 训练模型
    performance = model.train(texts, labels)
    print(f"Training performance: {performance}")
    
    # 测试预测
    test_texts = ["公司业绩超预期", "股价暴跌"]
    predictions = model.predict(test_texts)
    print(f"Predictions: {predictions}")
