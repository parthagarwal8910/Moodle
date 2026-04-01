const express = require("express");
const router = express.Router({ mergeParams: true }); 
const { exportGradesCSV, importGradesCSV, updateFinalGrade } = require("../controllers/grade.controller");
const upload = require("../middleware/upload.middleware");

const { 
  getCourseGrades, 
  updateComponents, 
  publishGrades, 
  getMyGrades 
} = require("../controllers/grade.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// CSV Export & Import
router.get("/export", protect, restrictTo("professor"), exportGradesCSV);

router.post("/import", protect, restrictTo("professor"), upload.single("file"), importGradesCSV);

// 1. Student views their own grades
router.get("/my-grades", protect, restrictTo("student"), getMyGrades);

// 2. Professor publishes the grades
router.patch("/publish", protect, restrictTo("professor"), publishGrades);

// 3. Professor views the whole class gradebook
router.get("/", protect, restrictTo("professor"), getCourseGrades);

// 4. Professor and TA updates a specific student's grade components
router.put("/:studentId/components", protect, restrictTo("professor", "ta"), updateComponents);

//Only Professor can give final grade
router.put("/:studentId/final", protect, restrictTo("professor"), updateFinalGrade);

module.exports = router;