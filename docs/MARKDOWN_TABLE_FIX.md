# Markdown 表格和列表渲染修复

## 问题描述

页面显示时，表格下方出现了异常的文本和红框，显示 "N))" 等乱码字符。

## 根本原因

1. **表格处理问题**：`processTable` 函数在处理表格后，没有正确过滤空行，导致一些残留字符被保留
2. **列表处理问题**：原有的正则表达式替换方式会导致列表项被重复包裹 `<ul>` 标签，造成 HTML 结构混乱

## 解决方案

### 1. 优化表格处理

**修改前：**
```javascript
// 非表格行
if (inTable && tableRows.length > 0) {
    const tableHtml = `<table>...</table>`
    result.push(tableHtml)
    tableRows = []
    inTable = false
}
result.push(line)  // 直接添加所有行，包括空行
```

**修改后：**
```javascript
// 非表格行
if (inTable && tableRows.length > 0) {
    const tableHtml = `<table>...</table>`
    result.push(tableHtml)
    tableRows = []
    inTable = false
}
// 只添加非空行
if (trimmedLine) {
    result.push(line)
}
```

### 2. 重构列表处理

**修改前：**
```javascript
// 使用正则替换，容易造成重复包裹
html = html.replace(/^\s*[\*\-]\s+(.*)$/gim, '<li>$1</li>')
html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
```

**修改后：**
```javascript
// 使用状态机逐行处理
const listLines = html.split('\n')
let inList = false
let listHtml = []

for (let i = 0; i < listLines.length; i++) {
    const line = listLines[i]
    const listMatch = line.match(/^\s*[\*\-]\s+(.*)$/)
    
    if (listMatch) {
        if (!inList) {
            inList = true
            listHtml.push('<ul>')
        }
        listHtml.push(`<li>${listMatch[1]}</li>`)
    } else {
        if (inList) {
            listHtml.push('</ul>')
            inList = false
        }
        listHtml.push(line)
    }
}

if (inList) {
    listHtml.push('</ul>')
}

html = listHtml.join('\n')
```

## 优势

### ✅ 表格处理优化
- 正确过滤空行
- 避免残留字符
- 保持原有行的格式

### ✅ 列表处理重构
- 使用状态机，逻辑更清晰
- 避免重复包裹标签
- 正确处理连续和非连续列表
- 更好的边界处理

## 测试场景

### 场景 1：表格后紧跟文本
```markdown
| 列1 | 列2 |
|-----|-----|
| A   | B   |

这是表格后的文本
```

**预期结果**：表格正常显示，文本在表格下方，无乱码

### 场景 2：连续列表
```markdown
- 项目 1
- 项目 2
- 项目 3
```

**预期结果**：所有项目在同一个 `<ul>` 中

### 场景 3：非连续列表
```markdown
- 项目 1
- 项目 2

这是段落

- 项目 3
- 项目 4
```

**预期结果**：两个独立的 `<ul>`，中间有段落

## 代码变更

### 修改文件
- `utils/markdown.js`

### 主要变更
1. **表格处理**：添加空行过滤逻辑
2. **列表处理**：从正则替换改为状态机处理

## 性能影响

- **表格处理**：性能基本无变化
- **列表处理**：从 O(n²) 降低到 O(n)，性能提升

---

**修复时间**: 2024-11-13  
**影响范围**: 知识库详情页 Markdown 渲染  
**测试状态**: ✅ 待验证
