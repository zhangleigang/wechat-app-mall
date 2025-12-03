/**
 * 简单的 Markdown 转 HTML 工具
 * 支持常用的 Markdown 语法
 */

/**
 * 将 Markdown 文本转换为 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 文本
 */
function markdownToHtml(markdown) {
    if (!markdown) return ''

    let html = markdown

    // 1. 先处理代码块（避免代码块内容被其他规则处理）
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function (_, lang, code) {
        // 特殊处理：如果是流程图或文本图表，使用特殊样式
        const trimmedCode = code.trim()

        // 判断是否为 Mermaid 流程图
        const isMermaid = lang === 'mermaid' || trimmedCode.startsWith('flowchart') || trimmedCode.startsWith('graph')

        if (isMermaid) {
            // Mermaid 流程图：使用优化的文本树形结构渲染
            return renderMermaidAsTree(trimmedCode)
        }

        // 判断是否为简单流程图：主要包含向下箭头 ↓，且不是 ASCII 艺术图
        const hasDownArrow = trimmedCode.includes('↓')
        const hasRightArrow = trimmedCode.includes('→')
        const isAsciiArt = trimmedCode.includes('+-') || (trimmedCode.match(/\|/g) || []).length > 5
        const isFlowchart = (hasDownArrow || hasRightArrow) && !isAsciiArt

        if (isFlowchart) {
            // 简单流程图：使用美化的 HTML 渲染
            return renderFlowchart(trimmedCode)
        } else if (isAsciiArt) {
            // ASCII 艺术图：使用等宽字体，每行用 div 包裹以保持格式
            const lines = trimmedCode.split('\n')
            let asciiHtml = '<div style="background:#f8f9fa;padding:12px;border-radius:8px;margin:12px 0;border:1px solid #e0e0e0;overflow-x:auto;">'
            lines.forEach(line => {
                // 使用 &nbsp; 替换空格以保持格式
                const formattedLine = escapeHtml(line).replace(/ /g, '&nbsp;')
                asciiHtml += `<div style="font-family:Consolas,Monaco,Courier,monospace;font-size:11px;line-height:1.3;white-space:nowrap;color:#333;">${formattedLine || '&nbsp;'}</div>`
            })
            asciiHtml += '</div>'
            return asciiHtml
        } else {
            // 普通代码块
            return `<pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0;font-size:13px;line-height:1.6;"><code>${escapeHtml(trimmedCode)}</code></pre>`
        }
    })

    // 2. 处理表格（逐行处理）
    html = processTable(html)

    // 3. 处理标题（从6级到1级，避免误匹配）
    html = html.replace(/^###### (.*$)/gim, '<h6 style="font-size:13px;font-weight:bold;margin:10px 0 6px 0;color:#555;">$1</h6>')
    html = html.replace(/^##### (.*$)/gim, '<h5 style="font-size:14px;font-weight:bold;margin:11px 0 6px 0;color:#444;">$1</h5>')
    html = html.replace(/^#### (.*$)/gim, '<h4 style="font-size:15px;font-weight:bold;margin:12px 0 7px 0;color:#333;">$1</h4>')
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:17px;font-weight:bold;margin:14px 0 8px 0;color:#333;">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:19px;font-weight:bold;margin:16px 0 10px 0;color:#333;">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size:21px;font-weight:bold;margin:18px 0 12px 0;color:#333;">$1</h1>')

    // 4. 处理粗体和斜体
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong style="font-weight:bold;color:#333;">$1</strong>')
    html = html.replace(/\*([^\*]+)\*/g, '<em style="font-style:italic;">$1</em>')

    // 5. 处理行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;color:#e83e8c;">$1</code>')

    // 6. 处理链接
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" style="color:#667eea;text-decoration:underline;">$1</a>')

    // 7. 处理列表
    const listLines = html.split('\n')
    let inList = false
    let listHtml = []

    for (let i = 0; i < listLines.length; i++) {
        const line = listLines[i]
        const listMatch = line.match(/^\s*[\*\-]\s+(.*)$/)

        if (listMatch) {
            if (!inList) {
                inList = true
                listHtml.push('<ul style="margin:8px 0;padding-left:20px;">')
            }
            listHtml.push(`<li style="line-height:1.8;margin-bottom:4px;">${listMatch[1]}</li>`)
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

    // 8. 处理引用
    html = html.replace(/^>\s+(.*)$/gim, '<blockquote style="border-left:4px solid #667eea;padding-left:12px;margin:12px 0;color:#666;font-style:italic;">$1</blockquote>')

    // 9. 处理分隔线
    html = html.replace(/^---$/gim, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">')

    // 10. 处理段落
    html = html.split('\n\n').map(para => {
        para = para.trim()
        if (!para) return ''
        if (para.startsWith('<')) return para
        return `<p style="margin:8px 0;line-height:1.8;color:#555;font-size:14px;">${para}</p>`
    }).join('')

    // 11. 处理换行
    html = html.replace(/\n/g, '<br/>')

    return html
}

/**
 * 处理表格
 */
function processTable(text) {
    const lines = text.split('\n')
    const result = []
    let inTable = false
    let tableRows = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()

        // 检测表格行（以 | 开头和结尾）
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.includes('|')) {
            // 解析单元格
            const cells = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim())

            // 跳过分隔行 |---|---| 或 | :--- | :--- |
            const isSeparator = cells.every(cell => /^[\s\-:]+$/.test(cell))
            if (isSeparator) {
                continue
            }

            if (!inTable) {
                inTable = true
                tableRows = []
            }
            const isHeader = tableRows.length === 0

            if (isHeader) {
                // 表头
                const cellsHtml = cells.map(cell =>
                    `<th style="border:1px solid #ddd;padding:8px 10px;background:#f8f9fa;font-weight:bold;text-align:left;font-size:13px;">${cell}</th>`
                ).join('')
                tableRows.push(`<tr>${cellsHtml}</tr>`)
            } else {
                // 普通行
                const cellsHtml = cells.map(cell =>
                    `<td style="border:1px solid #ddd;padding:8px 10px;text-align:left;font-size:13px;">${cell}</td>`
                ).join('')
                tableRows.push(`<tr>${cellsHtml}</tr>`)
            }
        } else {
            // 非表格行
            if (inTable && tableRows.length > 0) {
                // 结束表格
                const tableHtml = `<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">${tableRows.join('')}</table>`
                result.push(tableHtml)
                tableRows = []
                inTable = false
            }
            // 只添加非空行
            if (trimmedLine) {
                result.push(line)
            }
        }
    }

    // 处理最后的表格
    if (inTable && tableRows.length > 0) {
        const tableHtml = `<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">${tableRows.join('')}</table>`
        result.push(tableHtml)
    }

    return result.join('\n')
}



/**
 * 将 Mermaid 流程图转换为优化的可视化结构
 */
function renderMermaidAsTree(mermaidCode) {
    const lines = mermaidCode.trim().split('\n')
    const nodes = new Map() // 存储节点ID到文本的映射
    const edges = [] // 存储边关系
    const edgeLabels = new Map() // 存储边的标签

    // 解析 Mermaid 代码
    for (let i = 1; i < lines.length; i++) { // 跳过第一行 (flowchart TD)
        const line = lines[i].trim()
        if (!line) continue

        // 解析节点定义和边，支持多种格式
        // 格式1: A[文本] --> B[文本]
        // 格式2: A[文本] -- 标签 --> B[文本]
        // 格式3: A{条件?} -- 是 --> B[文本]
        const arrowMatch = line.match(/(\w+)(?:[\[\{]([^\]\}]+)[\]\}])?\s*(?:--\s*([^-]+?)\s*)?-->\s*(\w+)(?:[\[\{]([^\]\}]+)[\]\}])?/)

        if (arrowMatch) {
            const [, fromId, fromText, edgeLabel, toId, toText] = arrowMatch

            // 保存节点文本
            if (fromText && !nodes.has(fromId)) {
                // 清理HTML标签和特殊字符
                const cleanText = fromText
                    .replace(/<br\s*\/?>/gi, ' ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .trim()
                nodes.set(fromId, cleanText)
            }
            if (toText && !nodes.has(toId)) {
                const cleanText = toText
                    .replace(/<br\s*\/?>/gi, ' ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .trim()
                nodes.set(toId, cleanText)
            }

            // 保存边关系和标签
            const edgeKey = `${fromId}-${toId}`
            edges.push({ from: fromId, to: toId, label: edgeLabel ? edgeLabel.trim() : '' })
            if (edgeLabel) {
                edgeLabels.set(edgeKey, edgeLabel.trim())
            }
        }
    }

    // 如果没有解析到任何节点，返回简单提示
    if (nodes.size === 0) {
        return `<div style="background:#f8f9fa;padding:16px;border-radius:12px;margin:16px 0;text-align:center;">
            <div style="color:#667eea;font-size:15px;font-weight:bold;margin-bottom:8px;">📊 流程图</div>
            <div style="color:#666;font-size:13px;">流程图内容解析中...</div>
        </div>`
    }

    // 构建树形结构
    const children = new Map() // 存储每个节点的子节点
    const parents = new Set() // 存储所有有父节点的节点

    edges.forEach(edge => {
        if (!children.has(edge.from)) {
            children.set(edge.from, [])
        }
        children.get(edge.from).push({ id: edge.to, label: edge.label })
        parents.add(edge.to)
    })

    // 找到根节点（没有父节点的节点）
    const roots = []
    nodes.forEach((text, id) => {
        if (!parents.has(id)) {
            roots.push(id)
        }
    })

    // 如果没有根节点，使用第一个节点
    if (roots.length === 0 && nodes.size > 0) {
        roots.push(nodes.keys().next().value)
    }

    // 生成HTML
    let html = '<div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:18px;border-radius:12px;margin:16px 0;box-shadow:0 4px 12px rgba(102,126,234,0.2);">'
    html += '<div style="color:#fff;font-size:15px;font-weight:bold;margin-bottom:14px;text-align:center;">📊 流程图</div>'
    html += '<div style="background:rgba(255,255,255,0.96);padding:14px;border-radius:8px;overflow-x:auto;">'

    // 渲染树形结构
    const visited = new Set()

    function renderNode(nodeId, level = 0, isLast = false) {
        if (visited.has(nodeId)) {
            // 避免循环引用
            return `<div style="margin:5px 0;padding-left:${level * 24}px;color:#999;font-size:12px;">
                <span style="color:#ff6b6b;">⚠️ 循环引用: ${escapeHtml(nodes.get(nodeId) || nodeId)}</span>
            </div>`
        }
        visited.add(nodeId)

        const text = nodes.get(nodeId) || nodeId
        let result = ''

        // 节点样式
        const indent = level * 24
        let connector = ''
        let nodeColor = '#2c3e50'
        let nodeBg = 'transparent'
        let fontWeight = 'normal'
        let fontSize = '13px'

        if (level === 0) {
            connector = '🎯 '
            nodeColor = '#667eea'
            nodeBg = 'rgba(102,126,234,0.12)'
            fontWeight = 'bold'
            fontSize = '14px'
        } else {
            connector = isLast ? '└─ ' : '├─ '
        }

        result += `<div style="margin:5px 0;padding-left:${indent}px;">`
        result += `<span style="color:${nodeColor};font-weight:${fontWeight};background:${nodeBg};padding:5px 10px;border-radius:6px;display:inline-block;font-size:${fontSize};line-height:1.6;">`
        result += `${connector}${escapeHtml(text)}`
        result += `</span>`
        result += `</div>`

        // 渲染子节点
        const childNodes = children.get(nodeId) || []
        childNodes.forEach((child, index) => {
            const isLastChild = index === childNodes.length - 1

            // 如果有边标签，显示它
            if (child.label) {
                result += `<div style="margin:2px 0;padding-left:${(level + 1) * 24}px;color:#999;font-size:11px;">
                    <span style="color:#667eea;font-style:italic;">↓ ${escapeHtml(child.label)}</span>
                </div>`
            }

            result += renderNode(child.id, level + 1, isLastChild)
        })

        return result
    }

    // 渲染所有根节点
    roots.forEach((rootId, index) => {
        html += renderNode(rootId, 0, index === roots.length - 1)
    })

    html += '</div></div>'

    return html
}

/**
 * 渲染流程图
 */
function renderFlowchart(text) {
    const lines = text.split('\n')
    let html = '<div style="background:linear-gradient(to right, #f8f9fa 0%, #ffffff 20%);padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:16px 0;box-shadow:0 2px 8px rgba(102,126,234,0.1);">'

    lines.forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine) {
            html += '<div style="height:8px;"></div>'
            return
        }

        // 检测箭头和缩进
        const indent = line.search(/\S/)
        const hasDownArrow = trimmedLine.includes('↓')
        const hasRightArrow = trimmedLine.includes('→')
        const isArrowLine = trimmedLine === '↓' || trimmedLine.startsWith('↓')

        // 样式
        let lineStyle = 'margin:4px 0;font-size:14px;line-height:1.8;'
        let contentStyle = ''

        if (isArrowLine) {
            // 纯箭头行：居中，大号，彩色
            lineStyle += 'text-align:center;'
            contentStyle = 'font-size:24px;color:#667eea;font-weight:bold;'
        } else if (hasDownArrow || hasRightArrow) {
            // 包含箭头的行：突出显示
            contentStyle = 'color:#2c3e50;'
        } else {
            // 普通文本行
            contentStyle = 'color:#2c3e50;font-weight:500;'
        }

        // 添加缩进
        if (indent > 0) {
            lineStyle += `padding-left:${indent * 8}px;`
        }

        // 高亮关键词
        let content = escapeHtml(trimmedLine)
        content = content.replace(/(Map|Reduce|Shuffle|HDFS|输入|输出)/g, '<strong style="color:#667eea;font-weight:bold;">$1</strong>')

        // 美化箭头
        content = content.replace(/↓/g, '<span style="color:#667eea;font-size:20px;font-weight:bold;">↓</span>')
        content = content.replace(/→/g, '<span style="color:#667eea;font-size:18px;font-weight:bold;">→</span>')

        html += `<div style="${lineStyle}"><span style="${contentStyle}">${content}</span></div>`
    })

    html += '</div>'
    return html
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
}

module.exports = {
    markdownToHtml
}
