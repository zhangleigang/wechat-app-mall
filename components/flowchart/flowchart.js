Component({
    properties: {
        // 流程图数据
        flowData: {
            type: String,
            value: '',
            observer: 'renderFlowchart'
        },
        // 画布宽度
        width: {
            type: Number,
            value: 350
        },
        // 画布高度
        height: {
            type: Number,
            value: 400
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
                canvasId: 'flowchart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                canvasWidth: this.properties.width,
                canvasHeight: this.properties.height
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

            if (this.properties.flowData) {
                this.renderFlowchart()
            }
        },

        /**
         * 渲染流程图
         */
        renderFlowchart() {
            if (!this.data.ctx || !this.properties.flowData) return

            const ctx = this.data.ctx
            const width = this.data.canvasWidth
            const height = this.data.canvasHeight

            // 清空画布
            ctx.clearRect(0, 0, width, height)

            // 设置背景
            const gradient = ctx.createLinearGradient(0, 0, width, 0)
            gradient.addColorStop(0, '#f8f9fa')
            gradient.addColorStop(1, '#ffffff')
            ctx.setFillStyle(gradient)
            ctx.fillRect(0, 0, width, height)

            // 解析流程图数据
            const nodes = this.parseFlowData(this.properties.flowData)

            // 绘制节点和连线
            this.drawNodes(ctx, nodes, width, height)

            // 提交绘制
            ctx.draw()
        },

        /**
         * 解析流程图数据
         */
        parseFlowData(flowData) {
            const lines = flowData.split('\n').filter(line => line.trim())
            const nodes = []
            let currentY = 60

            lines.forEach((line, index) => {
                const trimmedLine = line.trim()
                if (!trimmedLine) return

                const isArrow = trimmedLine === '↓' || trimmedLine.startsWith('↓')

                if (isArrow) {
                    // 箭头节点
                    nodes.push({
                        type: 'arrow',
                        text: '↓',
                        x: this.data.canvasWidth / 2,
                        y: currentY,
                        width: 30,
                        height: 30
                    })
                    currentY += 50
                } else {
                    // 文本节点
                    const textWidth = Math.min(trimmedLine.length * 12, this.data.canvasWidth - 40)
                    nodes.push({
                        type: 'text',
                        text: trimmedLine,
                        x: this.data.canvasWidth / 2,
                        y: currentY,
                        width: textWidth + 20,
                        height: 40
                    })
                    currentY += 70
                }
            })

            return nodes
        },

        /**
         * 绘制节点
         */
        drawNodes(ctx, nodes, width, height) {
            nodes.forEach(node => {
                if (node.type === 'text') {
                    this.drawTextNode(ctx, node)
                } else if (node.type === 'arrow') {
                    this.drawArrowNode(ctx, node)
                }
            })
        },

        /**
         * 绘制文本节点
         */
        drawTextNode(ctx, node) {
            const x = node.x - node.width / 2
            const y = node.y - node.height / 2

            // 绘制背景
            ctx.setFillStyle('#667eea')
            ctx.setGlobalAlpha(0.1)
            this.drawRoundRect(ctx, x, y, node.width, node.height, 8)
            ctx.fill()

            // 绘制边框
            ctx.setGlobalAlpha(1)
            ctx.setStrokeStyle('#667eea')
            ctx.setLineWidth(2)
            this.drawRoundRect(ctx, x, y, node.width, node.height, 8)
            ctx.stroke()

            // 绘制文字
            ctx.setFillStyle('#2c3e50')
            ctx.setFontSize(14)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('middle')

            // 处理长文本换行
            const maxWidth = node.width - 10
            const lines = this.wrapText(node.text, maxWidth, 14)
            const lineHeight = 18
            const startY = node.y - (lines.length - 1) * lineHeight / 2

            lines.forEach((line, index) => {
                ctx.fillText(line, node.x, startY + index * lineHeight)
            })
        },

        /**
         * 绘制箭头节点
         */
        drawArrowNode(ctx, node) {
            ctx.setFillStyle('#667eea')
            ctx.setFontSize(24)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('middle')
            ctx.fillText('↓', node.x, node.y)
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
                const testWidth = testLine.length * (fontSize * 0.6) // 估算宽度

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
        },

        /**
         * 触摸事件
         */
        onTouchStart(e) {
            // 可以添加交互功能
        },

        onTouchMove(e) {
            // 可以添加拖拽功能
        },

        onTouchEnd(e) {
            // 可以添加点击功能
        }
    }
})
