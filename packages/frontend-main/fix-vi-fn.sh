#!/bin/bash

echo "=== 批量修复 vi.fn() 调用 ==="

# 进入测试目录
cd src/test

# 替换所有的 vi.fn() 为 createMockFn()
sed -i '' 's/vi\.fn()/createMockFn()/g' setup.ts

# 替换所有的 vi.fn(() => {}) 为 createMockFn(() => {})
sed -i '' 's/vi\.fn(() => {})/createMockFn(() => {})/g' setup.ts

# 替换所有的 vi.fn(() => Promise.resolve()) 为 createMockFn(() => Promise.resolve())
sed -i '' 's/vi\.fn(() => Promise.resolve())/createMockFn(() => Promise.resolve())/g' setup.ts

echo "✅ vi.fn() 批量修复完成！"

