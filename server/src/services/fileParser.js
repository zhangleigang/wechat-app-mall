const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * 解析 PDF 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 解析后的文本内容
 */
async function parsePDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error('PDF解析失败: ' + error.message);
    }
}

/**
 * 解析 Word 文件 (.docx)
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 解析后的文本内容
 */
async function parseWord(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        throw new Error('Word文档解析失败: ' + error.message);
    }
}

/**
 * 解析 Markdown 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 解析后的文本内容
 */
async function parseMarkdown(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        throw new Error('Markdown文件读取失败: ' + error.message);
    }
}

/**
 * 解析图片文件 (暂不支持OCR)
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 提示信息
 */
async function parseImage(filePath) {
    // 初期版本暂不支持OCR，返回提示信息
    return '图片格式暂不支持自动解析，请上传文本格式的简历文件';
}

/**
 * 统一的文件解析接口
 * @param {string} filePath - 文件路径
 * @param {string} originalName - 原始文件名
 * @returns {Promise<string>} 解析后的文本内容
 */
async function parseFile(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();

    try {
        switch (ext) {
            case '.pdf':
                return await parsePDF(filePath);

            case '.doc':
            case '.docx':
                return await parseWord(filePath);

            case '.md':
                return await parseMarkdown(filePath);

            case '.jpg':
            case '.jpeg':
            case '.png':
                return await parseImage(filePath);

            default:
                throw new Error('不支持的文件格式');
        }
    } catch (error) {
        console.error('文件解析错误:', error);
        throw error;
    }
}

module.exports = {
    parseFile,
    parsePDF,
    parseWord,
    parseMarkdown,
    parseImage
};
