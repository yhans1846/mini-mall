---
name: git-commit
version: 1.0
description: 在提交代码时，自动生成符合 Conventional Commits 规范的 commit message
trigger: ["提交代码", "git commit", "生成commit"]
---

# Git 提交规范化

## 执行步骤

1. 运行 `git diff --staged` 查看暂存区的修改
2. 分析修改内容，判断变更类型：
   - feat: 新功能
   - fix: 修复Bug
   - refactor: 重构（不改变功能）
   - style: 样式修改
   - docs: 文档更新
   - test: 测试相关
   - chore: 构建/工具变更

3. 生成 commit message，格式：
   ```
   <type>(<scope>): <description>

   <body>
   ```

4. 显示给用户确认后执行 `git commit`

## 示例
修改了 src/components/BookmarkCard.tsx 中的样式

生成的 message：
​```
style(BookmarkCard): 优化书签卡片的响应式布局

- 调整了移动端下的卡片宽度
- 修复了标签溢出问题
​```