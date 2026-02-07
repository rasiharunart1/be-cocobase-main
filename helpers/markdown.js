const showdown = require('showdown');
const converter = new showdown.Converter();

const convertMarkdownToHtml = async (markdown) => {
    if (!markdown) return "";
    return converter.makeHtml(markdown);
};

module.exports = {
    convertMarkdownToHtml
};
