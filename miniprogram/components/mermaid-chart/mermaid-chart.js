Component({
    properties: {
        // Mermaid 代码
        mermaidCode: {
            type: String,
            value: '',
            observer: 'renderChart'
        },
        // 画布宽度
        width: {
            type: Number,
            value: 350
        }
    },

    data: {
        canvasId: '',
        canvasWidth: 350,
        canvasHeight: 400,
        ctx: null
    },

    lifetimes: {
        attached() {
            // 生成唯一的canvas ID
            this.setData({
                canvasId: 'mermaid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                canvasWidth: this.properties.width
            })

            // 延迟获取canvas上下文
            setTimeout(() => {
                this.initCanvas()
            }, 100)
        }
    },

    methods: {
        /**
         * 初始化Canvas
         */
        initCanvas() {
            const ctx = wx.createCanvasContext(this.data.canvasId, this)
            this.setData({ ctx })

            if (this.properties.mermaidCode) {
                this.renderChart()
            }
        },

        /**
         * 解析 Mermaid 代码
         */
        parseMermaid(code) {
            const lines = code.trim().split('\n')
            const nodes = []
            const edges = []
            let nodeIdCounter = 0
            const nodeMap = new Map() // 存储节点ID到节点对象的映射

            // 跳过第一行（flowchart TD）
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                // 解析节点和边
                // 格式: A[文本] --> B[文本]
                // 或: A --> B
                const arrowMatch = line.match(/(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/)

                if (arrowMatch) {
                    const [, fromId, fromText, toId, toText] = arrowMatch

                    // 添加源节点
                    if (!nodeMap.has(fromId)) {
                        const text = fromText || fromId
                        // 清理HTML标签
                        const cleanText = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
                        const node = {
                            id: fromId,
                            text: cleanText,
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 40
                        }
                        nodes.push(node)
                        nodeMap.set(fromId, node)
                    }

                    // 添加目标节点
                    if (!nodeMap.has(toId)) {
                        const text = toText || toId
                        const cleanText = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
                        const node = {
                            id: toId,
                            text: cleanText,
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 40
                        }
                        nodes.push(node)
                        nodeMap.set(toId, node)
                    }

                    // 添加边
                    edges.push({
                        from: fromId,
                        to: toId
                    })
                }
            }

            return { nodes, edges, nodeMap }
        },

        /**
         * 计算布局
         */
        calculateLayout(nodes, edges, nodeMap, canvasWidth) {
            // 构建层级结构
            const levels = []
            const visited = new Set()
            const inDegree = new Map()

            // 计算入度
            nodes.forEach(node => inDegree.set(node.id, 0))
            edges.forEach(edge => {
                inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1)
            })

            // 找到根节点（入度为0）
            const roots = nodes.filter(node => inDegree.get(node.id) === 0)

            // BFS 分层
            let queue = [...roots]
            let currentLevel = 0

            while (queue.length > 0) {
                const levelSize = queue.length
                const levelNodes = []

                for (let i = 0; i < levelSize; i++) {
                    const node = queue.shift()
                    if (visited.has(node.id)) continue

                    visited.add(node.id)
                    levelNodes.push(node)

                    // 找到子节点
                    edges.forEach(edge => {
                        if (edge.from === node.id) {
                            const childNode = nodeMap.get(edge.to)
                            if (childNode && !visited.has(childNode.id)) {
                                queue.push(childNode)
                            }
                        }
                    })
                }

                if (levelNodes.length > 0) {
                    levels.push(levelNodes)
                }
            }

            // 计算节点宽度（基于文本长度）
            const ctx = this.data.ctx
            ctx.setFontSize(13)

            nodes.forEach(node => {
                const textWidth = ctx.measureText(node.text).width || (node.text.length * 8)
                node.width = Math.max(textWidth + 30, 100)
            })

            // 计算每层的位置
            const levelHeight = 80
            const nodeSpacing = 20
            let maxWidth = 0

            levels.forEach((levelNodes, levelIndex) => {
                const totalWidth = levelNodes.reduce((sum, node) => sum + node.width, 0) +
                    (levelNodes.length - 1) * nodeSpacing
                maxWidth = Math.max(maxWidth, totalWidth)

                let startX = (canvasWidth - totalWidth) / 2
                const y = 60 + levelIndex * levelHeight

                levelNodes.forEach(node => {
                    node.x = startX + node.width / 2
                    node.y = y
                    startX += node.width + nodeSpacing
                })
            })

            // 计算画布高度
            const height = Math.max(levels.length * levelHeight + 100, 200)

            return { levels, height }
        },

        /**
         * 渲染图表
         */
        renderChart() {
            if (!this.data.ctx || !this.properties.mermaidCode) return

            const ctx = this.data.ctx
            const width = this.data.canvasWidth

            // 解析 Mermaid 代码
            const { nodes, edges, nodeMap } = this.parseMermaid(this.properties.mermaidCode)

            if (nodes.length === 0) {
                console.warn('No nodes found in mermaid code')
                return
            }

            // 计算布局
            const { levels, height } = this.calculateLayout(nodes, edges, nodeMap, width)

            // 更新画布高度
            this.setData({ canvasHeight: height })

            // 清空画布
            ctx.clearRect(0, 0, width, height)

            // 绘制背景
            ctx.setFillStyle('#f8f9fa')
            ctx.fillRect(0, 0, width, height)

            // 绘制边（箭头）
            ctx.setStrokeStyle('#667eea')
            ctx.setLineWidth(2)
            ctx.setFillStyle('#667eea')

            edges.forEach(edge => {
                const fromNode = nodeMap.get(edge.from)
                const toNode = nodeMap.get(edge.to)

                if (fromNode && toNode) {
                    const x1 = fromNode.x
                    const y1 = fromNode.y + fromNode.height / 2
                    const x2 = toNode.x
                    const y2 = toNode.y - toNode.height / 2

                    // 绘制线条
                    ctx.beginPath()
                    ctx.moveTo(x1, y1)
                    ctx.lineTo(x2, y2)
                    ctx.stroke()

                    // 绘制箭头
                    const angle = Math.atan2(y2 - y1, x2 - x1)
                    const arrowSize = 8

                    ctx.beginPath()
                    ctx.moveTo(x2, y2)
                    ctx.lineTo(
                        x2 - arrowSize * Math.cos(angle - Math.PI / 6),
                        y2 - arrowSize * Math.sin(angle - Math.PI / 6)
                    )
                    ctx.lineTo(
                        x2 - arrowSize * Math.cos(angle + Math.PI / 6),
                        y2 - arrowSize * Math.sin(angle + Math.PI / 6)
                    )
                    ctx.closePath()
                    ctx.fill()
                }
            })

            // 绘制节点
            nodes.forEach(node => {
                const x = node.x - node.width / 2
                const y = node.y - node.height / 2
                const w = node.width
                const h = node.height
                const r = 8

                // 绘制圆角矩形背景
                ctx.setFillStyle('#ffffff')
                this.drawRoundRect(ctx, x, y, w, h, r)
                ctx.fill()

                // 绘制边框
                ctx.setStrokeStyle('#667eea')
                ctx.setLineWidth(2)
                this.drawRoundRect(ctx, x, y, w, h, r)
                ctx.stroke()

                // 绘制文字
                ctx.setFillStyle('#2c3e50')
                ctx.setFontSize(13)
                ctx.setTextAlign('center')
                ctx.setTextBaseline('middle')

                // 处理长文本换行
                const maxWidth = w - 20
                const lines = this.wrapText(node.text, maxWidth, 13)
                const lineHeight = 18
                const startY = node.y - (lines.length - 1) * lineHeight / 2

                lines.forEach((line, index) => {
                    ctx.fillText(line, node.x, startY + index * lineHeight)
                })
            })

            // 提交绘制
            ctx.draw()
        },

        /**
         * 绘制圆角矩形
         */
        drawRoundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.lineTo(x + width - radius, y)
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
            ctx.lineTo(x + width, y + height - radius)
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
            ctx.lineTo(x + radius, y + height)
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
            ctx.lineTo(x, y + radius)
            ctx.quadraticCurveTo(x, y, x + radius, y)
            ctx.closePath()
        },

        /**
         * 文本换行
         */
        wrapText(text, maxWidth, fontSize) {
            const words = text.split('')
            const lines = []
            let currentLine = ''

            for (let word of words) {
                const testLine = currentLine + word
                const testWidth = testLine.length * (fontSize * 0.6)

                if (testWidth > maxWidth && currentLine !== '') {
                    lines.push(currentLine)
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            }

            if (currentLine) {
                lines.push(currentLine)
            }

            return lines.length > 0 ? lines : [text]
        }
    }
})
