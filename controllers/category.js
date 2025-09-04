import Category from '../models/category.js';
import slugify from "slugify";
import { errorHandler } from "../helpers/dbErrorHandler.js";
import Blog from "../models/blog.js";
// import NodeCache from "node-cache";
// const myCache = new NodeCache();

export const create = async (req, res) => {
    const { name, description } = req.body;
    const slug = slugify(name).toLowerCase();
    try {
        const category = new Category({ name, description, slug });
        const data = await category.save();
        // myCache.del("categorieslist");
        res.json(data);
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};

/*
export const list = async (req, res) => {
    try {
        const data = await Category.find({}).select('_id name description slug').exec();
        res.json(data);
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};
*/

export const list = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.perPage) || 12;
        const skip = (page - 1) * perPage;

        const totalCategories = await Category.countDocuments({});
        const data = await Category.find({})
            .select('_id name description slug')
            .skip(skip)
            .limit(perPage)
            .exec();

        res.json({
            categories: data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCategories / perPage),
                totalCategories: totalCategories,
                hasNextPage: page < Math.ceil(totalCategories / perPage),
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(400).json({ error: errorHandler(err) });
    }
};


/*
export const read = async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    // const cacheKey = `category_${slug}`;

    // const cachedData = myCache.get(cacheKey);
    // if (cachedData) {return res.json(cachedData);}

    try {
        const category = await Category.findOne({ slug }).select('_id name slug').exec();
        if (!category) { return res.status(400).json({ error: 'Category not found' }); }

        const blogs = await Blog.find({ categories: category })
            .populate('categories', '-_id name slug')
            .populate('postedBy', '_id name username')
            .select('title photo slug excerpt categories date postedBy tags')
            .exec();
        //  myCache.set(cacheKey, { category, blogs }, 3000);

        res.json({ category, blogs });
    } catch (err) {
        res.status(400).json({ error: errorHandler(err) });
    }
};
*/

export const read = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.perPage) || 12;
        const skip = (page - 1) * perPage;

        // Find category and populate blogs with pagination
        const category = await Category.findOne({ slug }).exec();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get total count of blogs in this category
        const totalBlogs = await Blog.countDocuments({ categories: category._id });

        // Get paginated blogs
        const blogs = await Blog.find({ categories: category._id })
            .sort({ date: -1 })
            .populate('categories', 'name slug')
            .select('title photo slug excerpt categories date')
            .skip(skip)
            .limit(perPage)
            .exec();

        res.json({
            category,
            blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / perPage),
                totalBlogs: totalBlogs,
                hasNextPage: page < Math.ceil(totalBlogs / perPage),
                hasPrevPage: page > 1
            },
            status: true,
            message: 'Category and blogs fetched successfully',
        });
    } catch (err) {
        console.error('Error fetching category:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const remove = async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    // const cacheKey = `category_${slug}`;

    try {
        const data = await Category.findOneAndDelete({ slug }).exec();
        if (!data) { return res.status(400).json({ error: 'Category not found' }); }
        // myCache.del(cacheKey);
        // myCache.del("categorieslist");
        res.json({ message: 'Category deleted successfully' });
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};