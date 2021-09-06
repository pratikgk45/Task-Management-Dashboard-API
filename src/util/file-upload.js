const multer = require('multer');

const avatarUpload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('only jpg/jpeg/png files allowed.'));
        }

        cb(undefined, true);
    }
});

module.exports = {
    avatarUpload
}