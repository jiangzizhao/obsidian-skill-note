# Skill Notes（Skill 便笺）

一个在 Obsidian 中集中管理本地 Skill 的插件。桌面宽屏固定一行 4 张卡片，支持搜索、分类、收藏、启停、查看详情和使用次数统计。

## Skill 目录格式

在 Vault 中创建 `Skills/<skill-name>/SKILL.md`：

```md
---
name: 内容改写
description: 将输入内容改写为不同平台适用的文案。
category: 内容创作
tags: [写作, 小红书]
---

# 使用说明
在这里记录 Skill 的完整提示词和工作流程。
```

## 开发与安装

```bash
npm install
npm run build
```

将 `main.js`、`manifest.json`、`styles.css` 复制到：

```text
<你的 Vault>/.obsidian/plugins/skill-manager/
```

然后在 Obsidian → 设置 → 第三方插件中启用 **Skill Notes**。“Skill 便笺”是本插件的中文名称。

## 隐私

插件只读取本机的 Skill 目录与 `SKILL.md` 文件，用于生成本地看板。收藏、启停和使用记录均保存在本地，不上传 Skill 内容。
