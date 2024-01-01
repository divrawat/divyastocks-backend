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
import tagRoutes from "./routes/tag.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";
import "dotenv/config.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
const clientid = process.env.GOOGLE_CLIENT_ID
const clientsecret = process.env.GOOGLE_CLIENT_SECRET
import User from "./models/user.js";
import jwt from "jsonwebtoken";
import { FRONTEND } from "./config.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", FRONTEND],
  methods: "GET,POST,PUT,DELETE,PATCH",
  credentials: true
}));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DATABASE, {}).then(() => console.log("DB connected")).catch((err) => console.log("DB Error => ", err));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);
app.use('/api', formRoutes);
app.use('/api', ImageRoutes);
app.use('/api', storyRoutes);

app.get('/', (req, res) => { res.json("Backend index"); });
const port = process.env.PORT || 8000;
app.listen(port, () => { console.log(`Server is running on port ${port}`); });

app.use(session({
  secret: clientsecret,
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true },

}))

app.use(passport.initialize());
app.use(passport.session());


passport.use(
  new GoogleStrategy({
    clientID: clientid,
    clientSecret: clientsecret,
    callbackURL: "/auth/google/callback",
    scope: ["profile", "email"]
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value }, "email username name profile role");
        return done(null, user)
      } catch (error) {
        return done(error, null)
      }
    }
  )
)

passport.serializeUser((user, done) => { done(null, user); })
passport.deserializeUser((user, done) => { done(null, user); });

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/*
 app.get("/auth/google/callback", passport.authenticate("google", {
   successRedirect: `${FRONTEND}`,
   failureRedirect: `${FRONTEND}/signin`
 }))
 */


app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND}/signin`);
    }
    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${FRONTEND}/signin`);
      }
      if (user.role === 1) {
        return res.redirect(`${FRONTEND}/admin`);
      } else {
        return res.redirect(`${FRONTEND}/user`);
      }
    });
  })(req, res, next);
});



app.get("/login/success", async (req, res) => {
  if (req.user) {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '10d' });
    res.status(200).json({ user: req.user, token })
  }
  else { res.status(400).json({ message: "Not Authorized" }) }
})


app.get("/logout",(req,res,next)=>{
  req.logout(function(err){
      if(err){return next(err)}
      res.redirect(`${FRONTEND}/signin`);
  })
})