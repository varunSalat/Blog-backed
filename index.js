import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import User from "./model/User.js";
import Blog from "./model/Blog.js";

// constand Var
const salt = 10;
const perPage = 10;
const filter = {};

dotenv.config();
const app = express();
const corsOptions = {
  origin: "https://scholarwithtech.com",
  // origin: "http://localhost:5173",
  credentials: true, // Allow credentials (cookies, etc.)
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO);

// User Routes
app.get("/api/reg", async (req, res) => {
  const { username, password, name, img, text } = req.body;
  if (text != process.env.TEXT) return res.status(400).json("Access Denied");

  const hashPassword = bcrypt.hashSync(password, salt);

  const newuser = await User.create({
    username,
    name,
    img,
    password: hashPassword,
  });
  return res.json(newuser);
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  if (!userDoc) return res.status(400).json("No user found");
  const pass = bcrypt.compareSync(password.toString(), userDoc.password);
  if (!pass) return res.status(400).json("Password is Wrong!");

  const data = { name: userDoc.name, img: userDoc.img };

  const token = Jwt.sign({ username, id: userDoc._id }, process.env.SECRET);
  return res
    .cookie("auth", token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json(data);
});

app.post("/api/blog", async (req, res) => {
  // Pagination
  const { page, s, cat } = req.body;
  const skip = (page - 1) * perPage;

  // Search Parameters
  const filter = {}; // Define an empty filter object
  if (s !== undefined) {
    const searchReg = new RegExp(s, "i");
    filter.$or = [{ title: searchReg }];
  }

  // Category
  if (cat !== undefined) {
    const catReg = new RegExp(cat, "i");
    filter.cat = catReg;
  }

  try {
    // Count total documents
    const totalCount = await Blog.countDocuments(filter);

    // Find blogs with author populated
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);
    res.status(200).json({ data: blogs, totalCount });
  } catch (err) {
    res.status(400).json(err);
  }
});

app.get("/api/mostBlog", async (req, res) => {
  const mostBlog = await Blog.find({ isMostViewed: true })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json(mostBlog);
});

app.get("/api/blog/:blogUrl", async (req, res) => {
  try {
    const blogUrl = req.params.blogUrl;
    const blog = await Blog.findOne({ url: blogUrl });
    const { name, img } = await User.findById(blog.author);

    return res.status(200).json({ blog, name, img });
  } catch (error) {
    return res.status(400).json("somethin went wrong!");
  }
});

app.delete("/api/blog/:blogId", async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const token = req.cookies.auth;
    if (!token) return res.status(401).json("Invalid Token");
    const v = Jwt.verify(token, process.env.SECRET);
    if (!v) return res.status(401).json("Invalid Token");
    await Blog.deleteOne({ _id: blogId });
    return res.status(200).json("Deleted Succesfully");
  } catch (error) {
    return res.status(400).json("somethin went wrong!");
  }
});

app.post("/api/create", async (req, res) => {
  const token = req.cookies.auth;
  const { title, summary, url, img, cat, blog, mostViewed } = req.body;
  if (!token) return res.status(401).json("Invalid Token");
  const v = Jwt.verify(token, process.env.SECRET);
  if (!v) return res.status(401).json("Invalid Token");
  const newBlog = new Blog({
    title,
    summary,
    url,
    cat,
    img,
    blog,
    isMostViewed: mostViewed,
    like: 0,
    dislike: 0,
    author: v.id,
  });
  await newBlog
    .save()
    .then((r) => res.status(200).json("Succesfully Created!"))
    .catch((err) => res.status(400).json(err));
});

app.post("/api/edit", async (req, res) => {
  const token = req.cookies.auth;
  const {
    title,
    summary,
    url,
    img,
    cat,
    blog,
    isMostViewed,
    like,
    dislike,
    author,
  } = req.body;
  if (!token) return res.status(401).json("Invalid Token");
  const v = Jwt.verify(token, process.env.SECRET);
  if (!v) return res.status(401).json("Invalid Token");
  const data = {
    title,
    summary,
    cat,
    img,
    blog,
    isMostViewed,
    like,
    dislike,
    author,
  };
  try {
    const newBlog = await Blog.updateOne({ url: url }, { $set: data });
    return res.status(200).json(newBlog);
  } catch (error) {
    return res.status(400).json(error);
  }
});

app.post("/api/like/:blogId", async (req, res) => {
  const { blogId } = req.params;
  const blog = await Blog.findOne({ _id: blogId });
  const like = blog.like + 1;
  await Blog.updateOne({ _id: blogId }, { $set: { like: like } });
  return res.status(200).json("Like added Succesfully");
});

app.post("/api/dislike/:blogId", async (req, res) => {
  const { blogId } = req.params;
  const blog = await Blog.findOne({ _id: blogId });
  const like = blog.dislike + 1;
  await Blog.updateOne({ _id: blogId }, { $set: { dislike: like } });
  return res.status(200).json("DisLike added Succesfully");
});

app.listen(process.env.PORT, () => {
  console.log("SERVER STARTED");
});
