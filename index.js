import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import blogRoutes from "./routes/blog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";
import "dotenv/config.js";
import { FRONTEND } from "./config.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", FRONTEND, 'https://divyastocks-frontend.pages.dev/, https://divyastocks.info'],
  methods: "GET,POST,PUT,DELETE,PATCH",
  credentials: true
}));



mongoose.set("strictQuery", true);
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, }).then(() => console.log("DB connected")).catch((err) => console.log("DB Error => ", err));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', formRoutes);
app.use('/api', ImageRoutes);
app.use('/api', storyRoutes);

app.get('/', (req, res) => { res.json("Backend index"); });
const port = process.env.PORT || 8000;
app.listen(port, () => { console.log(`Server is running on port ${port}`); });