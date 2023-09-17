import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    summary: String,
    url: { type: String, required: true, unique: true },
    cat: String,
    img: String,
    blog: { type: String, required: true },
    like: Number,
    dislike: Number,
    isMostViewed: Boolean,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const BlogModal = mongoose.model("Blog", BlogSchema);
export default BlogModal;
