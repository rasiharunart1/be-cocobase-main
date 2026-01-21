const marked = require("marked");
const sanitizeHtml = require("sanitize-html");

const convertMarkdownToHtml = (markdown) => {
  // Konfigurasi marked
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  });

  // Konfigurasi sanitize-html
  const sanitizeOptions = {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "p", "a", "ul", "ol", "nl",
      "li", "b", "i", "strong", "em", "strike",
      "code", "hr", "br", "div", "table", "thead",
      "caption", "tbody", "tr", "th", "td", "pre",
      "img", "span"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      div: ["class"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "ftp", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"]
    },
  };

  // Konversi markdown ke HTML dan sanitasi
  const rawHtml = marked.parse(markdown);
  const cleanHtml = sanitizeHtml(rawHtml, sanitizeOptions);

  return cleanHtml;
};

module.exports = { convertMarkdownToHtml };