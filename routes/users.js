const {
  getAllUsersCtrl,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  profilePhotoUploadCtrl,
  deleteUserProfileCtrl,
} = require("../controller/userController");
const photoUpload = require("../middlewares/photoUpload");
const verifyObjectId = require("../middlewares/verifyObjectId");
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndAuthrization,
} = require("../middlewares/verifyToken");

const router = require("express").Router();
// api/users/profile
router.get("/", verifyTokenAndAdmin, getAllUsersCtrl);

// api/users/profile/profile-photo-upload
router
  .route("/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUploadCtrl);

// api/users/profile/:id
router
  .get("/:id", verifyObjectId, getUserProfileCtrl)
  .put("/:id", verifyObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
  .delete(
    "/:id",
    verifyObjectId,
    verifyTokenAndAuthrization,
    deleteUserProfileCtrl
  );

module.exports = router;
