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
        const message = "Category created successfully";
        res.json({ data, message }); 
    } catch (err) {res.status(400).json({ error: errorHandler(err)});}  
};


export const list = async (req, res) => {
    // const cachedData = myCache.get("categorieslist");
    // if (cachedData) {return res.json(cachedData);}
    try {
        const data = await Category.find({}).select('_id name description slug').exec();
        // myCache.set("categorieslist", data, 3000);
        res.json(data);
    } catch (err) {res.status(400).json({error: errorHandler(err)});}  
};

// const totalCount = await Category.countDocuments({}).exec();
export const read = async (req, res) => {
    const slug = req.params.slug.toLowerCase();

        
    try {
        const category = await Category.findOne({ slug }).select('name slug').exec();
        if (!category) {return res.status(400).json({ error: 'Category not found' });}
        const totalCount = await Blog.countDocuments({ categories: category }).exec();

        const blogs = await Blog.find({ categories: category })
            .populate('categories', 'name slug')
            .populate('postedBy', 'name username')
            .select(' title photo slug excerpt categories date postedBy tags')
        res.json({ category, blogs, totalCount });
    } catch (err) {
        res.status(400).json({ error: errorHandler(err) });
    }
};



export const remove = async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    // const cacheKey = `category_${slug}`;

    try {
        const data = await Category.findOneAndDelete({ slug }).exec();
        if (!data) {  return res.status(400).json({error: 'Category not found' }); }
        // myCache.del(cacheKey);
        // myCache.del("categorieslist");
        res.json({message: 'Category deleted successfully'});
    } catch (err) {res.status(400).json({error: errorHandler(err)});}   
};