const verifyObjectId = require("../middlewares/verifyObjectId");
const {
  createPostCtrl,
  getPostCountCtrl,
  getAllPostsCtrl,
  getSinglePostCtrl,
  deletSinglePostCtrl,
  updatedPostCtrl,
  updatePostImageCtrl,
  toggleLike,
} = require("../controller/postController");
const photoUpload = require("../middlewares/photoUpload");
const { verifyToken } = require("../middlewares/verifyToken");
const router = require("express").Router();

// api/posts
router
  .post("/", verifyToken, photoUpload.single("image"), createPostCtrl)
  .get("/", getAllPostsCtrl);

// api/posts/count
router.get("/count", getPostCountCtrl);

// api/posts/:id
router
  .get("/:id", verifyObjectId, getSinglePostCtrl)
  .delete("/:id", verifyObjectId, verifyToken, deletSinglePostCtrl)
  .put("/:id", verifyObjectId, verifyToken, updatedPostCtrl);

// api/posts/upload-image/:id
router.put(
  "/upload-image/:id",
  verifyObjectId,
  verifyToken,
  photoUpload.single("image"),
  updatePostImageCtrl
);

// api/posts/like/:id
router.put("/likes/:id", verifyObjectId, verifyToken, toggleLike);

module.exports = router;
