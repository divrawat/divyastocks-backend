import mongoose from "mongoose";
import Blog from "./models/blog.js";
import Images from "./models/images.js";

// ✅ Your MongoDB connection string
const MONGO_URI = "mongodb+srv://divrawat2001:EUfHuFccwpkIaSQE@cluster-coding4u.vkzwjje.mongodb.net/divyastocks?retryWrites=true&w=majority";

const OLD_DOMAIN = "https://images.divyastocks.online/";

async function updateUrls() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected");

        // --- Update Blog photos ---
        const blogs = await Blog.find({ photo: { $regex: OLD_DOMAIN } });
        console.log(`Found ${blogs.length} blog(s) to update...`);

        for (const blog of blogs) {
            blog.photo = blog.photo.replace(OLD_DOMAIN, "");
            await blog.save();
        }
        console.log("✅ Blog photos updated (domain removed)");

        // --- Update Images urls ---
        const images = await Images.find({ url: { $regex: OLD_DOMAIN } });
        console.log(`Found ${images.length} image(s) to update...`);

        for (const image of images) {
            image.url = image.url.replace(OLD_DOMAIN, "");
            await image.save();
        }
        console.log("✅ Image URLs updated (domain removed)");

    } catch (error) {
        console.error("❌ Error updating URLs:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

updateUrls();
