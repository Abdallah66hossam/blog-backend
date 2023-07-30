const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
} = require("../utils/cloudinary");

/**-----------------------------------------------
 * @desc    Get All Users Profile
 * @route   /api/users/profile
 * @method  GET
 * @access  private (only admin)
 ------------------------------------------------*/
const getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json({ users });
});

/**-----------------------------------------------
 * @desc    Get User Profile
 * @route   /api/users/profile/:id
 * @method  GET
 * @access  public
 ------------------------------------------------*/
const getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) return res.status(200).json(user);
  else {
    return res.status(400).json({ message: "user id is not found" });
  }
});

/**-----------------------------------------------
 * @desc    Update User Profile
 * @route   /api/users/profile/:id
 * @method  PUT
 * @access  private (only user himself)
 ------------------------------------------------*/
const updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(updatedUser);
});

/**-----------------------------------------------
 * @desc    Delete User Profile
 * @route   /api/users/profile/:id
 * @method  DELETE
 * @access  private (only user himself)
 ------------------------------------------------*/
const deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // get user from DB
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user dosen't exixt" });
  }

  // Delete the profile picture from cloudinary
  if (user.avatar.publicId !== null) {
    await cloudinaryRemoveImage(user.avatar.publicId);
  }

  // delete the user himself
  await User.findByIdAndDelete(req.params.id);

  // send a response to the client
  res.status(200).json({ message: "your profile has been deleted" });
});

/**-----------------------------------------------
 * @desc    Profile Photo Upload
 * @route   /api/users/profile/profile-photo-upload
 * @method  POST
 * @access  private (only logged in user)
 ------------------------------------------------*/
const profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  // 1. Validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided" });
  }

  // 2. Get the path to the image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  // 3. Upload to cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  // 4. Get the user from DB
  const user = await User.findById(req.user.id);

  // 5. Delete the old profile photo if exist
  if (user.avatar?.publicId !== null) {
    await cloudinaryRemoveImage(user.avatar.publicId);
  }

  // 6. Change the avatar field in the DB
  user.avatar = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();

  // 7. Send response to client
  res.status(200).json({
    message: "your profile photo uploaded successfully",
    avatar: { url: result.secure_url, publicId: result.public_id },
  });

  // 8. Remvoe image from the server
  fs.unlinkSync(imagePath);
});

module.exports = {
  getAllUsersCtrl,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  profilePhotoUploadCtrl,
  deleteUserProfileCtrl,
};
