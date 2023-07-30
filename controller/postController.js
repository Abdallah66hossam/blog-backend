const asyncHandler = require("express-async-handler");
const {
  validateCreatePost,
  Post,
  validateUpdatePost,
} = require("../models/postModel");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
} = require("../utils/cloudinary");

/**-----------------------------------------------
 * @desc    GET all posts
 * @route   /api/posts
 * @method  GET
 * @access  public
 ------------------------------------------------*/
const getAllPostsCtrl = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { category, pageNumber } = req.query;
  let posts;

  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", "-password");
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", "-password");
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "-password");
  }
  res.status(200).json(posts);
});

/**-----------------------------------------------
 * @desc    GET Single post
 * @route   /api/posts/:id
 * @method  GET
 * @access  public
 ------------------------------------------------*/
const getSinglePostCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById({ _id: id }).populate("user", "-password");
  if (!post) return res.status(404).json({ status: "post is not found" });
  res.status(200).json(post);
});

/**-----------------------------------------------
 * @desc    DELETE all posts
 * @route   /api/posts/:id
 * @method  DELETE
 * @access  private (only user & admin can delet posts)
 ------------------------------------------------*/
const deletSinglePostCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById({ _id: id });
  if (!post) return res.status(404).json({ status: "post is not found" });

  if (req.user.isAdmin || req.user.id === post.user.id) {
    await Post.findByIdAndDelete({ _id: id });
    await cloudinaryRemoveImage(post.image.publicId);
    res.status(200).json({
      message: "post has been deleted successfully",
      postId: post._id,
    });
  } else {
    res.status(403).json({ message: "access denied, forbidden" });
  }
});

/**-----------------------------------------------
 * @desc    Get Posts Count
 * @route   /api/posts/count
 * @method  GET
 * @access  public
 ------------------------------------------------*/
const getPostCountCtrl = asyncHandler(async (req, res) => {
  const count = await Post.count();
  res.status(200).json(count);
});

/**-----------------------------------------------
 * @desc    Create New Post
 * @route   /api/posts
 * @method  POST
 * @access  private (only logged in user)
 ------------------------------------------------*/
const createPostCtrl = asyncHandler(async (req, res) => {
  // takin users inputs
  const { title, description, category } = req.body;

  // validate for img
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }

  // validate for user data
  const { error } = validateCreatePost(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
  }

  // upload photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // create new post and save it
  const post = await Post.create({
    title,
    description,
    category,
    user: req.user.id,
    image: { url: result.secure_url, publicId: result.public_id },
  });

  // send response t the client
  res.status(201).json(post);

  // remove image from the server
  fs.unlinkSync(imagePath);
});

/**-----------------------------------------------
 * @desc    Update Post
 * @route   /api/posts/:id
 * @method  PUT
 * @access  private (only owner in user)
 ------------------------------------------------*/
const updatedPostCtrl = asyncHandler(async (req, res) => {
  // take inputs from user
  const { title, description, category } = req.body;

  // validation
  const { error } = validateUpdatePost(req.body);
  if (error)
    return res.status(400).json({ message: errors.details[0].message });

  // selecting the post form DB and checking if it is exists
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "the post is not found" });

  // check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  // checking if the post belong to the user
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title,
        description,
        category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  // response to the client
  res.status(200).json(updatedPost);
});

/**-----------------------------------------------
 * @desc    Update Post Image
 * @route   /api/posts/upload-image/:id
 * @method  PUT
 * @access  private (only owner of the post)
 ------------------------------------------------*/
const updatePostImageCtrl = asyncHandler(async (req, res) => {
  // validation
  if (!req.file)
    return res.status(400).json({ message: "There is no image provided" });

  // Get the post from DB and check if post exist
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });

  // check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  // delete the old image
  await cloudinaryRemoveImage(post.image.publicId);

  // upload new photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // update the image field in the db
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );

  // send response to client
  res.status(200).json(updatedPost);

  // remvoe image from the server
  fs.unlinkSync(imagePath);
});

/**-----------------------------------------------
 * @desc    Toggle Like
 * @route   /api/posts/like/:id
 * @method  PUT
 * @access  private (only logged in user)
 ------------------------------------------------*/
const toggleLike = asyncHandler(async (req, res) => {
  // getting the post from DB
  let post = await Post.findById(req.params.id);

  // validation
  if (!post) return res.status(404).json({ message: "Post not found" });

  // checking if the post is already liked
  const isAlreadyLiked = post.likes.find(
    (user) => user.toString() === req.user.id
  );
  // if it is already liked pull the user id from likes array
  if (isAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          likes: req.user.id,
        },
      },
      { new: true }
    );
  }
  // if it is not liked push the user id to likes array
  else {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          likes: req.user.id,
        },
      },
      { new: true }
    );
  }

  // response to the client
  res.status(200).json(post);
});
module.exports = {
  createPostCtrl,
  getPostCountCtrl,
  getAllPostsCtrl,
  getSinglePostCtrl,
  deletSinglePostCtrl,
  updatedPostCtrl,
  updatePostImageCtrl,
  toggleLike,
};
