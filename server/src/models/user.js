const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // password is required only if googleId is not present
      },
    },
    googleId: {
      type: String,
      required: function () {
        return !this.password; // googleId is required only if password is not present
      },
      unique: true,
      sparse: true, // ✅ this allows multiple documents to omit googleId
    },
    avatar: String,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
  }
);
const User = mongoose.model("user", userSchema);

module.exports = User;
