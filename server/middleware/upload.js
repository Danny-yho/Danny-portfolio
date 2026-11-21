const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../utils/config');

fs.mkdirSync(config.uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, config.uploadDir),
  filename: (req, file, callback) => {
    const extension = file.mimetype === 'image/jpeg' ? '.jpg' :
      file.mimetype === 'image/png' ? '.png' :
        file.mimetype === 'image/webp' ? '.webp' : '.gif';
    callback(null, `${Date.now()}-${require('crypto').randomBytes(8).toString('hex')}${extension}`);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(Object.assign(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'), { status: 400 }));
    }
    callback(null, true);
  }
});
