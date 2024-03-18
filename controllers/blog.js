import Blog from "../models/blog.js";
import { errorHandler } from "../helpers/dbErrorHandler.js";
import slugify from "slugify";
import striptags from 'striptags';
import "dotenv/config.js";
import multer from 'multer';
import { FRONTEND } from "../config.js";
const upload = multer({});

export const create = async (req, res) => {
    upload.none()(req, res, async (err) => {
      if (err) { return res.status(400).json({ error: 'Something went wrong' }) }
      const { title, description, slug, photo, categories, mtitle, mdesc, date, body } = req.body;
  
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
      let strippedContent = striptags(body);
      let excerpt0 = strippedContent.slice(0, 150);
      blog.excerpt = excerpt0;
      try {
        let arrayOfCategories = categories && categories.split(',');
        await blog.save();
        const updatedBlog = await Blog.findByIdAndUpdate(blog._id, { $push: {categories: { $each: arrayOfCategories }
        } }, { new: true }).exec();
        res.json(updatedBlog);
         fetch(`${FRONTEND}/api/revalidate?path=/${blog.slug}`, { method: 'POST' })
         fetch(`${FRONTEND}/api/revalidate?path=/`, { method: 'POST' })
      } catch (error) { return res.status(500).json({ error: "Slug should be unique" }) }
    });
  };


export const update = async (req, res) => {

    upload.none()(req, res, async (err) => {
      if (err) { return res.status(400).json({ error: 'Something went wrong' }) }
      try {
        const slug = req.params.slug.toLowerCase();
        if (!slug) { return res.status(404).json({ error: 'Blog not found' }) }
  
        let blog = await Blog.findOne({ slug }).exec();

        const { title, description, photo, categories, mtitle, mdesc, date, body } = req.body;
        const updatefields=req.body;

        Object.keys(updatefields).forEach((key) => {

          if (key === 'title') { blog.title = title; }
          else if (key === 'description') { blog.description = description; }
          else if (key === 'mtitle') { blog.mtitle = mtitle; }
          else if (key === 'mdesc') { blog.mdesc = mdesc; }
          else if (key === 'date') { blog.date = date }
          else if (key === 'body') { blog.body = body; }
          else if (key === 'categories') { blog.categories = categories.split(',').map(category => category.trim()); }
          else if (key === 'excerpt') { blog.excerpt = strippedContent.slice(0, 150);} 
          else if (key === 'slug') { blog.slug = slugify(updatefields.slug).toLowerCase(); }
          else if (key === 'photo') { blog.photo = photo; }
        });
        const savedBlog = await blog.save();
        

         await fetch(`${FRONTEND}/api/revalidate?path=/${blog.slug}`, { method: 'POST' });
        await  fetch(`${FRONTEND}/api/revalidate?path=/`, { method: 'POST' });
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
          fetch(`${FRONTEND}/api/revalidate?path=/${slug}`, { method: 'POST' });
          fetch(`${FRONTEND}/api/revalidate?path=/`, { method: 'POST' })
    } catch (error) { res.json({ "error": "Something went wrong" }) }
};



export const relatedposts = async (req, res) => {
    try {
      const slug = req.params.slug.toLowerCase();
      const blogpost = await Blog.findOne({ slug }).exec();
      if (!blogpost) {return res.status(404).json({ error: 'Blog not found' });}
        
      const categories = blogpost.categories;
  
      const data = await Blog.find({ _id: { $ne: blogpost._id },categories: { $in: categories }, })
        .populate('postedBy', '_id name username profile').select('title slug postedBy date photo').limit(6);
        
      res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: "Something Went Wrong" });}
  };


export const allblogs = async (req, res) => {
    try {
        const data = await Blog.find({}).sort({ date: -1 }).select(' slug date').exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};




export const allblogslugs = async (req, res) => {
    try {
        const data = await Blog.find({}).select(' slug').exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};




export const feeds = async (req, res) => {
    try {
        const data = await Blog.find({}).sort({ date: -1 })
            .populate('postedBy', ' name username').select(' title excerpt mdesc slug date body postedBy').limit(7).exec();
        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};





export const listAllBlogsCategoriesTags = async (req, res) => {
    try {
        const blogs = await Blog.find({}).sort({ date: -1 })
            .populate('categories', ' name slug')
            .populate('postedBy', ' name username profile').select(' title photo slug excerpt categories date tags postedBy').exec();
        res.json({ blogs, size: blogs.length });
    } catch (err) { res.json({ error: errorHandler(err) }); }
};



export const read = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();

        const data = await Blog.findOne({ slug })
            .populate('categories', ' name slug').populate('postedBy', 'name username')
            .select('photo title body slug mtitle mdesc date categories tags postedBy').exec();
        if (!data) { return res.status(404).json({ error: 'Blogs not found' }); }


        res.json(data);
    } catch (err) { res.json({ error: errorHandler(err) }); }
};




export const list0 = async (req, res) => {
  try {
      const totalCount = await Blog.countDocuments({}).exec();
      const page = parseInt(req.query.page) || 1;
      const perPage = 10;
      const skip = (page - 1) * perPage;
      const data = await Blog.find({}).populate('postedBy', ' name username').sort({ date: -1 }).select('-_id title slug date postedBy').skip(skip).limit(perPage).exec();
      res.json({totalBlogs: totalCount , data }); 
  } catch (err) { console.error('Error fetching Blogs:', err); res.status(500).json({ error: 'Internal Server Error' }); }  
};


export const list = async (req, res) => {
  try {
      const totalCount = await Blog.countDocuments({}).exec();
      const page = Number(req.query.page) || 1;
      const perPage = 10;
      const { search } = req.query;
      const query = {$or: [{ title: { $regex: search, $options: 'i' } },]};    
      
      const skip = (page - 1) * perPage;
      const data = await Blog.find(query).populate('postedBy', 'name username').sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();
      res.json({
          status: true,
          message: 'All Blogs Fetched Successfully',
          totalBlogs: totalCount , data 
      });
  } catch (err) { console.error('Error fetching Blog:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};