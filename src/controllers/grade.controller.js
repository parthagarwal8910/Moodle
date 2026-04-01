const Grade = require("../models/grade.model");
const Course = require("../models/course.model");
const { success } = require("../utils/apiResponse");

//calculate final score
const calculateFinalScore = (components, weights) => {
  let totalScore = 0;
  const keys = ["quiz1", "quiz2", "midsem", "endsem", "attendance", "misc"];
  
  keys.forEach(key => {
    if (components[key] !== null && components[key] !== undefined) {
      // (Component Score / 100) * Weight Percentage
      totalScore += (components[key] / 100) * weights[key];
    }
  });
  
  return parseFloat(totalScore.toFixed(2)); // Round to 2 decimal places
};

// 1. Get entire class gradebook (Professors & TAs)
exports.getCourseGrades = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    
    const course = await Course.findOne({ courseId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Security: Only the instructor (or future TAs) can view the whole gradebook
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to view these grades." });
    }

    // Fetch grades and populate the student's name and collegeId
    const grades = await Grade.find({ course: course._id })
      .populate("student", "name collegeId email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: grades.length,
      data: grades
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update Component Grades (Professors & TAs)
exports.updateComponents = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    const updates = req.body;

    const course = await Course.findOne({ courseId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.id && req.user.role !== "ta") {
      return res.status(403).json({ message: "Forbidden: Only Instructors and TAs can edit components." });
    }

    const gradeSheet = await Grade.findOne({ course: course._id, student: studentId });
    if (!gradeSheet) return res.status(404).json({ message: "Grade sheet not found." });

    const updateMessages = [];
    Object.keys(updates).forEach((key) => {
      if (gradeSheet.components[key] !== undefined) {
        gradeSheet.components[key] = updates[key];
        updateMessages.push(`Updated ${key} to ${updates[key]}`);
      }
    });

    gradeSheet.finalScore = calculateFinalScore(gradeSheet.components, course.weights);

    if (updateMessages.length > 0) {
      gradeSheet.auditLog.push({
        updatedBy: req.user.id,
        role: req.user.role,
        action: updateMessages.join(", ") + ` | Auto-calculated new Final Score: ${gradeSheet.finalScore}`
      });
    }

    await gradeSheet.save();
    return success(res, "Grades updated and final score recalculated", gradeSheet);
  } catch (error) {
    next(error);
  }
};
// 3. Publish Grades (Professor Only)
exports.publishGrades = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findOne({ courseId });

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Only the instructor can publish." });
    }

    const allGrades = await Grade.find({ course: course._id });
    const missingGrades = allGrades.filter(g => g.finalGrade === null);

    if (missingGrades.length > 0) {
      return res.status(400).json({ 
        message: `Cannot publish. ${missingGrades.length} students are missing their official Final Grade.` 
      });
    }

    course.gradesPublished = true;
    await course.save();

    return success(res, "Grades successfully published to all students.");
  } catch (error) {
    next(error);
  }
};

// 4. View My Grades (Student Only)
exports.getMyGrades = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findOne({ courseId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Security Check 1: Are grades published yet?
    if (!course.gradesPublished) {
      return res.status(403).json({ 
        message: "Grades for this course have not been released by the instructor yet." 
      });
    }

    // Security Check 2: Fetch ONLY the logged-in student's grade sheet
    const myGrade = await Grade.findOne({ 
      course: course._id, 
      student: req.user.id 
    }).select("-auditLog"); // We hide the audit log from the student for security

    if (!myGrade) {
      return res.status(404).json({ message: "Grade sheet not found." });
    }

    return res.status(200).json({
      success: true,
      data: myGrade
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Assign Official Letter Grade (Professor ONLY)
exports.updateFinalGrade = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    const { finalGrade } = req.body;

    const course = await Course.findOne({ courseId });
    
    // SECURITY: strictly professor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Only the Professor can assign final grades." });
    }

    const gradeSheet = await Grade.findOne({ course: course._id, student: studentId });
    gradeSheet.finalGrade = finalGrade;
    
    gradeSheet.auditLog.push({
      updatedBy: req.user.id,
      role: "professor",
      action: `Assigned official Final Grade: ${finalGrade}`
    });

    await gradeSheet.save();
    return success(res, "Final grade assigned successfully", gradeSheet);
  } catch (error) {
    next(error);
  }
};
const { Parser } = require("json2csv");
const csv = require("csvtojson");

// Export Grades to CSV
exports.exportGradesCSV = async (req, res, next) => {
  try {
    const course = await Course.findOne({ courseId: req.params.courseId });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const grades = await Grade.find({ course: course._id }).populate("student", "name collegeId");
    
    // Flatten data for Excel
    const csvData = grades.map(g => ({
      StudentID: g.student._id.toString(), // CRITICAL for re-importing
      RollNumber: g.student.collegeId,
      Name: g.student.name,
      Quiz1: g.components.quiz1 || 0,
      Quiz2: g.components.quiz2 || 0,
      Midsem: g.components.midsem || 0,
      Endsem: g.components.endsem || 0,
      Attendance: g.components.attendance || 0,
      Misc: g.components.misc || 0,
      CalculatedScore: g.finalScore || 0,
      OfficialFinalGrade: g.finalGrade || ""
    }));

    const json2csvParser = new Parser();
    const csvString = json2csvParser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(`${req.params.courseId}_Grades.csv`);
    return res.send(csvString);
  } catch (error) {
    next(error);
  }
};

// Import Grades from CSV
exports.importGradesCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please upload a CSV file" });
    
    const course = await Course.findOne({ courseId: req.params.courseId });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    // Parse CSV to JSON
    const gradeData = await csv().fromFile(req.file.path);

    // Loop through CSV rows and update database
    for (let row of gradeData) {
      if (row.StudentID) {
        const gradeSheet = await Grade.findOne({ course: course._id, student: row.StudentID });
        if (gradeSheet) {
          gradeSheet.components = {
            quiz1: Number(row.Quiz1), quiz2: Number(row.Quiz2),
            midsem: Number(row.Midsem), endsem: Number(row.Endsem),
            attendance: Number(row.Attendance), misc: Number(row.Misc)
          };
          gradeSheet.finalGrade = row.OfficialFinalGrade || null;
          gradeSheet.finalScore = calculateFinalScore(gradeSheet.components, course.weights);
          
          gradeSheet.auditLog.push({
            updatedBy: req.user.id,
            role: "professor",
            action: "Bulk updated via CSV Import"
          });
          await gradeSheet.save();
        }
      }
    }

    return success(res, "Grades successfully imported and recalculated from CSV");
  } catch (error) {
    next(error);
  }
};