const { marked } = require('marked');

const convertMarkdownToHtml = async (markdown) => {
    if (!markdown) return "";
    return marked.parse(markdown);
};

module.exports = {
    convertMarkdownToHtml
};
