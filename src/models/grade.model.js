const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    course: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course", 
      required: true 
    },
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // The distributed components (TAs will manage these)
    components: {
      quiz1: { type: Number, default: null },
      quiz2: { type: Number, default: null },
      midsem: { type: Number, default: null },
      endsem: { type: Number, default: null },
      project: { type: Number, default: null },
      misc: { type: Number, default: null } 
    },

    // The Final Grade (Professors ONLY)
    finalScore: { type: Number, default: null }, 
    finalGrade: { type: String, default: null }, 
    
    // The Audit Log (For academic integrity)
    auditLog: [
      {
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["professor", "ta", "system"] },
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// CRITICAL: Ensure a student can only have ONE grade sheet per course
gradeSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Grade", gradeSchema);