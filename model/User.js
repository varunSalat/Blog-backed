import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, min: 4, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  img: { type: String, required: true },
});

const UserModal = mongoose.model("User", UserSchema);
export default UserModal;
