const imagekit = require("./imagekit");
const path = require("path");

const uploadFiles = async (file, id, folder, name) => {
    if (!file) return null;

    const strFile = file.buffer.toString("base64");
    const fileName = `${name ? name.replace(/\s+/g, '_') : 'image'}_${Date.now()}${path.extname(file.originalname)}`;

    const response = await imagekit.upload({
        file: strFile,
        fileName: fileName,
        folder: folder ? `/${folder}` : "/uploads"
    });

    return {
        url: response.url,
        fileId: response.fileId
    };
};

module.exports = uploadFiles;
