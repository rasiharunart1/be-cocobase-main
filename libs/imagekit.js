const ImageKit = require("imagekit");

let imagekit;

if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    try {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
    } catch (error) {
        console.error("Failed to initialize ImageKit:", error.message);
        imagekit = null;
    }
} else {
    console.warn("ImageKit environment variables are missing. Image upload functionality will be disabled.");
    imagekit = null;
}

module.exports = imagekit;
