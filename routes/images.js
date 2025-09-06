
import express from "express";
const router = express.Router();
import sharp from "sharp"
import Images from "../models/images.js";


/*
export const uploadimages = async (req, res) => {
    try {
        const { url } = req.body;
        const images = new Images({ url });
        const data = await images.save();
        res.json(data);
    } catch (err) { res.status(400).json({ error: "Something went wrong" }) }
};

export const allimages = async (req, res) => {
    try {
        const totalCount = await Images.countDocuments({}).exec();
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;
        const data = await Images.find({}).sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();
        res.json({ totalImages: totalCount, data });
    } catch (err) { console.error('Error fetching images:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};


export const remove = async (req, res) => {
    try {
        const { url } = req.params;
        if (url) {
            const deletedImage = await Images.findOneAndDelete({ url }).exec();
            if (deletedImage) {
                res.json({ message: 'Image deleted successfully' });
            } else { res.status(404).json({ error: 'Image Cannot be found or deleted' }); }
        }
    } catch (err) { console.error(err); res.status(500).json({ error: 'Cannot delete image' }); }
};


router.post('/uploadimages', requireSignin, adminMiddleware, uploadimages);
router.get('/allimages', allimages);
router.delete('/images/:url', remove);

export default router
*/


const storage = multer.memoryStorage();
import multer from "multer"
import s3Client from "../controllers/r2Uploader.js"
const upload = multer({ storage });
import { PutObjectCommand } from '@aws-sdk/client-s3';


/*
router.post('/images/upload', upload.array('images', 10), async (req, res) => {
    try {
        const uploadedUrls = [];

        // Upload each file to R2
        for (const file of req.files) {
            const key = `${Date.now()}-${file.originalname}`;
            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            const publicUrl = `${process.env.R2_UPLOAD_DOMAIN}/${key}`;
            uploadedUrls.push(publicUrl);


            await new Images({ url: publicUrl }).save();
        }

        res.status(201).json({
            message: 'Images uploaded successfully',
            urls: uploadedUrls,
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
});
*/

router.post('/images/upload', upload.array('images', 10), async (req, res) => {
    try {
        const uploadedUrls = [];

        for (const file of req.files) {
            // Convert buffer to WebP using sharp
            const webpBuffer = await sharp(file.buffer)
                .webp({ quality: 75 }) // Optional: set WebP quality
                .toBuffer();

            // Create new filename with .webp extension
            const originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
            const key = `${Date.now()}-${originalNameWithoutExt}.webp`;

            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: webpBuffer,
                ContentType: 'image/webp',
                ACL: 'public-read',
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            const publicUrl = `${process.env.R2_UPLOAD_DOMAIN}/${key}`;
            uploadedUrls.push(publicUrl);

            await new Images({ url: publicUrl }).save();
        }

        res.status(201).json({
            message: 'Images uploaded successfully',
            urls: uploadedUrls,
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
});













router.get('/images', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    try {
        const images = await Images.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Images.countDocuments();

        res.json({
            images,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

export default router;
