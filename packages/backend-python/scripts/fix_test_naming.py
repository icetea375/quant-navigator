#!/usr/bin/env python3
"""
修复测试命名规范脚本
将 test_should_ 格式改为 test_should_..._when_... 格式
遵循测试宪法第3.0条：定义契约，而非修补测试
"""

from pathlib import Path


def fix_test_naming(file_path):
    """修复单个文件的测试命名"""
    with open(file_path, encoding="utf-8") as f:
        content = f.read()

    # 定义测试方法名映射
    test_mappings = {
        "test_should_initialize_with_config": "test_should_initialize_with_config_when_provided",
        "test_should_initialize_with_default_config": "test_should_initialize_with_default_config_when_no_config_provided",
        "test_should_prepare_features_successfully": "test_should_prepare_features_successfully_when_valid_data_provided",
        "test_should_handle_missing_values_in_prepare_features": "test_should_handle_missing_values_when_data_contains_nan",
        "test_should_handle_infinite_values_in_prepare_features": "test_should_handle_infinite_values_when_data_contains_inf",
        "test_should_raise_exception_on_prepare_features_error": "test_should_raise_exception_when_prepare_features_fails",
        "test_should_train_model_successfully": "test_should_train_model_successfully_when_valid_data_provided",
        "test_should_predict_successfully": "test_should_predict_successfully_when_model_trained",
        "test_should_raise_exception_on_predict_without_model": "test_should_raise_exception_when_predict_without_model",
        "test_should_save_model_successfully": "test_should_save_model_successfully_when_model_trained",
        "test_should_load_model_successfully": "test_should_load_model_successfully_when_valid_path_provided",
        "test_should_raise_exception_on_load_nonexistent_model": "test_should_raise_exception_when_load_nonexistent_model",
        "test_should_evaluate_model_successfully": "test_should_evaluate_model_successfully_when_model_trained",
        "test_should_get_feature_importance_successfully": "test_should_get_feature_importance_successfully_when_model_trained",
        "test_should_raise_exception_on_get_importance_without_model": "test_should_raise_exception_when_get_importance_without_model",
        "test_should_handle_empty_dataframe_in_prepare_features": "test_should_handle_empty_dataframe_when_dataframe_is_empty",
        "test_should_handle_missing_columns_in_prepare_features": "test_should_handle_missing_columns_when_required_columns_missing",
        "test_should_handle_save_model_error": "test_should_handle_save_model_error_when_save_fails",
        "test_should_handle_load_model_error": "test_should_handle_load_model_error_when_load_fails",
        "test_should_create_layer1_config_successfully": "test_should_create_layer1_config_successfully_when_called",
    }

    # 应用映射
    for old_name, new_name in test_mappings.items():
        content = content.replace(f"def {old_name}(", f"def {new_name}(")

    # 写回文件
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Fixed test naming in {file_path}")


def main():
    """主函数"""
    test_dir = Path(__file__).parent.parent / "tests" / "unit"

    # 查找所有测试文件
    test_files = list(test_dir.rglob("test_*.py"))

    for test_file in test_files:
        if test_file.is_file():
            print(f"Processing {test_file}")
            fix_test_naming(test_file)

    print("Test naming fix completed!")


if __name__ == "__main__":
    main()
