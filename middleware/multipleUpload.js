// multipleUpload.js
import multer from 'multer';

// Handle Multiple File Upload
const multipleUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1000000 * 100,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported'));
        }
    },
}).array('image', 4); // Corrected to handle files with field name 'image' and max 4 files

export default multipleUpload;
