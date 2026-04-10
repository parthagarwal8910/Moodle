const express = require("express");
const router = express.Router();

const { 
  getAllUsers, 
  deleteUser,
  getMe,
  updateProfile,
  updatePassword,
  getTranscript
} = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// Logged in user routes
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/me/password", protect, updatePassword);
router.get("/me/transcript", protect, getTranscript);

// Admin / Prof / TA routes
router.get("/", protect, restrictTo("professor", "ta", "admin"), getAllUsers);
router.delete("/:id", protect, restrictTo("admin", "professor"), deleteUser);

module.exports = router;