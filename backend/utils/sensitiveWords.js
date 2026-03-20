// 简单敏感词列表（实际可扩展）
const sensitiveList = ['敏感词1', '敏感词2', '政治敏感', '色情'];

function filterSensitiveWords(text) {
    const found = [];
    for (const word of sensitiveList) {
        if (text.includes(word)) {
            found.push(word);
        }
    }
    return found;
}

module.exports = { filterSensitiveWords };
