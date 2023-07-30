const asyncHandler = require("express-async-handler");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**-------------------------------
 * @desc  Register new user
 * @route  /api/auth/regeister
 * @method POST 
 * @acsses Public
---------------------------------*/
const userSignup = asyncHandler(async (req, res) => {
  // validation
  const { error } = validateRegisterUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // is user alredy exists
  const { email, password, username } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "User already exists" });

  // new user and save it in db
  const hashedpassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    username,
    email,
    password: hashedpassword,
  });

  const user = await newUser.save();
  res.status(201).json({ message: "User registered successfully" });
  // send response to client

  res.status(200).json({ user });

  // const accessToken = createToken();

  // res.status(400).json({ error: err.message });
});

/*-------------------------------
 * @desc    Login new user
 * @route  /api/auth/login
 * @method POST 
 * @acsses Public
---------------------------------*/
const userLoginin = asyncHandler(async (req, res) => {
  // validation
  const { error } = validateLoginUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  // checking if user exixts
  const { email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (!userExists)
    return res.status(400).json({ error: "Invalid email or password" });
  // check the password
  const comparePass = await bcrypt.compare(password, userExists.password);

  // @TODO - sending email (verify account if not verified)

  // generate new token
  const token = userExists.generateAuthToken();

  if (userExists && comparePass) {
    res.status(200).json({
      isAdmin: userExists.isAdmin,
      avatar: userExists.avatar,
      isAccountVerified: userExists.isAccountVerified,
      token,
    });
  } else {
    res.status(400).json({ error: "Invalid email or password" });
  }
});

module.exports = { userSignup, userLoginin };
