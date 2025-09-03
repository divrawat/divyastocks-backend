import Blog from "../models/blog.js";
import { errorHandler } from "../helpers/dbErrorHandler.js";
import slugify from "slugify";
import User from "../models/user.js";
import striptags from 'striptags';
import "dotenv/config.js";
import multer from 'multer';
const upload = multer({});

export const create = async (req, res) => {
    upload.none()(req, res, async (err) => {
        if (err) { return res.status(400).json({ error: 'Something went wrong' }) }
        const { title, description, slug, photo, categories, mtitle, mdesc, date, body, author } = req.body;

        if (!categories || categories.length === 0) { return res.status(400).json({ error: 'At least one category is required' }) }

        let blog = new Blog();
        blog.title = title;
        blog.slug = slugify(slug).toLowerCase();
        blog.description = description;
        blog.mtitle = mtitle;
        blog.mdesc = mdesc;
        blog.photo = photo;
        blog.date = date;
        blog.body = body;
        blog.postedBy = req.auth._id;
        blog.author = author;
        let strippedContent = striptags(body);
        let excerpt0 = strippedContent.slice(0, 150);
        blog.excerpt = excerpt0;
        try {
            let arrayOfCategories = categories && categories.split(',');
            await blog.save();
            const updatedBlog = await Blog.findByIdAndUpdate(blog._id, {
                $push: { categories: { $each: arrayOfCategories } }
            }, { new: true }).exec();
            res.json(updatedBlog);
            //  fetch(`${process.env.MAIN_URL}/api/revalidate?path=/${blog.slug}`, { method: 'POST' })
            //  fetch(`${process.env.MAIN_URL}/api/revalidate?path=/`, { method: 'POST' })
        } catch (error) {
            console.log(error);

            return res.status(500).json({ error: "Slug should be unique" })
        }
    });
};


export const update = async (req, res) => {

    upload.none()(req, res, async (err) => {
        if (err) { return res.status(400).json({ error: 'Something went wrong' }) }
        try {
            const slug = req.params.slug.toLowerCase();

            if (!slug) { return res.status(404).json({ error: 'Blog not found' }) }

            let blog = await Blog.findOne({ slug }).exec();

            const { title, description, photo, categories, mtitle, mdesc, date, body, author } = req.body;
            const updatefields = req.body;

            Object.keys(updatefields).forEach((key) => {

                if (key === 'title') { blog.title = title; }
                else if (key === 'description') { blog.description = description; }
                else if (key === 'mtitle') { blog.mtitle = mtitle; }
                else if (key === 'mdesc') { blog.mdesc = mdesc; }
                else if (key === 'date') { blog.date = date }
                else if (key === 'body') { blog.body = body; }
                else if (key === 'author') { blog.author = author; }
                else if (key === 'categories') { blog.categories = categories.split(',').map(category => category.trim()); }
                else if (key === 'excerpt') { blog.excerpt = strippedContent.slice(0, 150); }
                else if (key === 'slug') { blog.slug = slugify(updatefields.slug).toLowerCase(); }
                else if (key === 'photo') { blog.photo = photo; }
            });
            const savedBlog = await blog.save();


            // await fetch(`${process.env.MAIN_URL}/api/revalidate?path=/${blog.slug}`, { method: 'POST' });
            // fetch(`${process.env.MAIN_URL}/api/revalidate?path=/`, { method: 'POST' });
            return res.status(200).json(savedBlog);
        } catch (error) {
            console.error("Error updating Blog:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });

};


export const remove = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const data = await Blog.findOneAndDelete({ slug }).exec();
        if (!data) { return res.json({ error: 'Blog not found' }); }
        res.json({ message: 'Blog deleted successfully' });
        // fetch(`${process.env.MAIN_URL}/api/revalidate?path=/${slug}`, { method: 'POST' });
        // fetch(`${process.env.MAIN_URL}/api/revalidate?path=/`, { method: 'POST' })
    } catch (error) { res.json({ "error": "Something went wrong" }) }
};



export const relatedposts = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const blogpost = await Blog.findOne({ slug }).exec();
        if (!blogpost) { return res.status(404).json({ error: 'Blog not found' }); }
        const categories = blogpost.categories;
        const data = await Blog.find({ _id: { $ne: blogpost._id }, categories: { $in: categories }, })
            .populate('postedBy', '_id name username profile').select('title slug postedBy date photo').limit(6);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: "Something Went Wrong" }); }
};


export const allblogs0 = async (req, res) => {
    try {
        const data = await Blog.find({}).sort({ date: -1 }).select('slug date').exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};


export const allblogs = async (req, res) => {

    try {
        const totalCount = await Blog.countDocuments().exec();
        const page = Number(req.query.page) || 1;
        const perPage = 20;
        const { search } = req.query;
        const query = { $and: [{ name: { $regex: search, $options: 'i' } }] };
        const skip = (page - 1) * perPage;
        const data = await Blog.find(query).sort({ date: -1 }).skip(skip).limit(perPage).exec();

        res.json({
            data: data,
            status: true,
            message: 'All Blogs Fetched Successfully',
            totalBlogs: totalCount
        });
    } catch (err) { console.error('Error fetching Blogs:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};







export const allblogslugs = async (req, res) => {
    try {
        const data = await Blog.find({}).select('slug date').exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};




export const feeds = async (req, res) => {
    try {
        const data = await Blog.find({}).sort({ date: -1 })
            .populate('postedBy', '-_id name username').select('-_id title excerpt mdesc slug date body postedBy').limit(7).exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};



export const list = async (req, res) => {
    try {
        const totalCount = await Blog.countDocuments({}).exec();
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;
        const data = await Blog.find({}).populate('postedBy', '-_id name username').sort({ date: -1 }).select('-_id title slug date postedBy').skip(skip).limit(perPage).exec();
        res.json({ totalBlogs: totalCount, data });
    } catch (err) { console.error('Error fetching Blogs:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};



export const listAllBlogsCategoriesTags = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.perPage) || 20;
        const skip = (page - 1) * perPage;

        // Get total count of blogs
        const totalBlogs = await Blog.countDocuments({});

        // Get paginated blogs
        const blogs = await Blog.find({})
            .sort({ date: -1 })
            .populate('categories', 'name slug')
            .select('title photo slug excerpt categories date author')
            .skip(skip)
            .limit(perPage)
            .exec();

        const recentPosts = await Blog.find({}).sort({ date: -1 }).select('title _id slug photo date').limit(10).exec();

        res.json({
            blogs: blogs,
            recentPosts: recentPosts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / perPage),
                totalBlogs: totalBlogs,
                hasNextPage: page < Math.ceil(totalBlogs / perPage),
                hasPrevPage: page > 1
            },
            status: true,
            message: 'All Blogs Fetched Successfully',
        });
    } catch (err) {
        console.error('Error fetching Blogs:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const read = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();

        const data = await Blog.findOne({ slug })
            .populate('categories', ' name slug')
            .select('photo title body slug mtitle mdesc date categories author').exec();

        const recentPosts = await Blog.find({}).sort({ date: -1 }).select('title _id slug photo date').limit(10).exec();
        if (!data) { return res.status(404).json({ error: 'Blogs not found' }); }

        res.json({ data: data, recentPosts: recentPosts });
    } catch (err) { res.json({ error: errorHandler(err) }); }
};



export const listSearch = async (req, res) => {
    const { search } = req.query;
    if (search) {
        Blog.find({
            $or: [
                { title: { $regex: search, $options: 'i' } },
                {
                    body: { $regex: search, $options: 'i' }
                }
            ]
        }).select('-photo -body').exec((err, blogs) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(blogs);
        });
    }
};



export const listByUser = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        const userId = user._id;
        const data = await Blog.find({ postedBy: userId }).populate('postedBy', '-_id name').select('-_id title date postedBy slug').exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};




export const list2 = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        const userId = user._id;
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;

        const data = await Blog.find({ postedBy: userId }).populate('postedBy', '-_id name username').sort({ date: -1 }).select('-_id title slug date postedBy').skip(skip).limit(perPage).exec();

        const totalCount = await Blog.countDocuments({ postedBy: userId }).exec();
        res.json({ totalBlogs: totalCount, data });
    } catch (err) { console.error('Error fetching Blogs:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};