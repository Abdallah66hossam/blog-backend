const { model, Schema } = require("mongoose");
const joi = require("joi");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// User Schema
const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    avatar: {
      type: Object,
      default: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png",
        publicId: null,
      },
    },
    bio: String,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Generate user token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.SECRET_KEY
  );
};

// user model
const User = model("User", UserSchema);

// validate user inputs
function validateRegisterUser(user) {
  const schema = joi.object({
    username: joi.string().trim().min(2).max(100).required(),
    email: joi.string().trim().min(5).max(100).required().email(),
    password: joi.string().min(8).required(),
  });
  return schema.validate(user);
}

function validateLoginUser(user) {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).required().email(),
    password: joi.string().min(8).required(),
  });
  return schema.validate(user);
}

// Validate Update User
function validateUpdateUser(obj) {
  const schema = joi.object({
    username: joi.string().trim().min(2).max(100),
    password: joi.string().min(8),
    bio: joi.string(),
  });
  return schema.validate(obj);
}

// // Validate Email
// function validateEmail(obj) {
//   const schema = Joi.object({
//     email: Joi.string().trim().min(5).max(100).required().email(),
//   });
//   return schema.validate(obj);
// }

// // Validate New Password
// function validateNewPassword(obj) {
//   const schema = Joi.object({
//     password: passwordComplexity().required(),
//   });
//   return schema.validate(obj);
// }

module.exports = {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
};
