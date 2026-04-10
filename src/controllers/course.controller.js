const Course = require("../models/course.model");
const { success } = require("../utils/apiResponse");
const courseService = require('../services/course.service');
const Lesson = require("../models/lesson.model");
const Submission = require("../models/submission.model");
const fs = require("fs");
const Grade = require("../models/grade.model");
// 1. Get All Courses
exports.getCourses = async (req, res, next) => {
  try {
    // Re-adding your getCourses logic based on your Day 5 notes
    const courses = await Course.find()
      .populate("instructor", "name email collegeId")
      .select("-students -tas");
    return success(res, "Courses fetched successfully", courses);
  } catch (error) {
    next(error);
  }
};

// 2. Create Course (Prof Only)
exports.createCourse = async (req, res, next) => {
  try {
    const { courseId, title, description, instructor, department, semester } = req.body;

    if (!courseId || !title || !description || !department || !semester) {
      return res.status(400).json({ message: "courseId, title, department, semester and description are required" });
    }

    let assignedInstructor = req.user.id;
    if (req.user.role === 'admin') {
      if (!instructor) {
         return res.status(400).json({ message: "Admin must assign an instructor to the course" });
      }
      assignedInstructor = instructor;
    }

    const course = await Course.create({
      courseId,
      title,
      description,
      department,
      semester,
      instructor: assignedInstructor
    });

    return success(res, "Course created successfully", course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Course with this ID already exists" });
    }
    next(error);
  }
};

// 3. Get Single Course
exports.getSingleCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await courseService.getCourseById(courseId);

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};


// 4. Student Enroll
exports.enrollInCourse = async (req, res, next) => {
  try {
    // REFACTORED: Use findOne with the custom courseId field
    const course = await Course.findOne({ courseId: req.params.id });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const User = require("../models/user.model");
    const fullUser = await User.findById(req.user.id);

    if (!fullUser || (fullUser.department !== course.department && course.department !== 'All')) {
      return res.status(403).json({
        message: `Forbidden: You belong to the ${fullUser?.department || 'Unknown'} department and cannot enroll in a ${course.department} course.`
      });
    }

    const alreadyEnrolled = course.students.some(
      (studentId) => studentId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }

    course.students.push(req.user.id);
    await course.save();
    await Grade.create({
      course: course._id,
      student: req.user.id,
      auditLog: [
        {
          role: "system",
          action: "Empty grade sheet automatically initialized upon course enrollment."
        }
      ]
    });
    return success(res, "Enrolled successfully and grade sheet created", course);
  } catch (error) {
    next(error);
  }
};

// 5. Update Course (Owner Only)
exports.updateCourse = async (req, res, next) => {
  try {
    const customCourseId = req.params.id;

    // REFACTORED: Use findOne to search by custom courseId
    let course = await Course.findOne({ courseId: customCourseId });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Authorization logic
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to update this course"
      });
    }

    // REFACTORED: Use findOneAndUpdate instead of findByIdAndUpdate
    course = await Course.findOneAndUpdate(
      { courseId: customCourseId },
      req.body,
      { new: true, runValidators: true }
    );

    return success(res, "Course updated successfully", course);
  } catch (error) {
    next(error);
  }
};

// 6. Delete Course (Owner Only) + Cascading File Cleanup
exports.deleteCourse = async (req, res, next) => {
  try {
    const customCourseId = req.params.id;

    // 1. Find the course to check ownership
    const course = await Course.findOne({ courseId: customCourseId });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Authorization logic
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this course"
      });
    }

    // 3. Clean up Lessons
    const lessons = await Lesson.find({ course: course._id });
    lessons.forEach((lesson) => {
      if (lesson.fileUrl) {
        // Delete the physical lesson file
        fs.unlink(lesson.fileUrl, (err) => {
          if (err) console.error(`Warning: Failed to delete lesson file ${lesson.fileUrl}:`, err);
        });
      }
    });
    // Delete all lesson records from the DB for this course
    await Lesson.deleteMany({ course: course._id });

    // 4. Clean up Submissions
    const submissions = await Submission.find({ course: course._id });
    submissions.forEach((submission) => {
      if (submission.fileUrl) {
        // Delete the physical submission zip file
        fs.unlink(submission.fileUrl, (err) => {
          if (err) console.error(`Warning: Failed to delete submission file ${submission.fileUrl}:`, err);
        });
      }
    });
    // Delete all submission records from the DB for this course
    await Submission.deleteMany({ course: course._id });

    // 5. Finally, delete the Course itself
    await Course.findOneAndDelete({ courseId: customCourseId });

    res.status(200).json({
      success: true,
      message: "Course, alongside all associated lessons, submissions, and files, were deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get "My Courses" (Instructor Dashboard)
exports.getMyCourses = async (req, res, next) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await Course.find()
        .populate("instructor", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'professor') {
      courses = await Course.find({ instructor: req.user.id })
        .populate("students", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      courses = await Course.find({ students: req.user.id })
        .populate("instructor", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'ta') {
      courses = await Course.find({ tas: req.user.id })
        .populate("instructor", "name email")
        .sort({ createdAt: -1 });
    } else {
      courses = [];
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};