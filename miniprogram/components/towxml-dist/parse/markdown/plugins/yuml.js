const config = require('../../../config');
const mermaidChart = (code) => {
    return `<yuml value="${encodeURIComponent(code)}"></yuml>`;
}

module.exports = md => {
    const temp = md.renderer.rules.fence.bind(md.renderer.rules)
    md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
        const token = tokens[idx]
        const code = token.content.trim();
        // 支持yuml和mermaid语法
        if (token.info === 'yuml' || token.info === 'mermaid' || token.info === 'flowchart' || token.info === 'graph') {
            return mermaidChart(code)
        };
        // 自动检测流程图语法
        const firstLine = code.split(/\n/)[0].trim()
        if (firstLine === 'gantt' || firstLine === 'sequenceDiagram' || 
            firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/) || 
            firstLine.match(/^flowchart (?:TB|BT|RL|LR|TD);?$/)) {
            return mermaidChart(code)
        }
        return temp(tokens, idx, options, env, slf)
    }
};