const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../services/email.service");
// ── EMAIL REGEX ────────────────────────────────────────────────
const emailRegex = /^[a-zA-Z]+_[0-9]{4}[a-zA-Z]{2}[0-9]{2,3}@iitp\.ac\.in$/;

// ── GENERATE 4 DIGIT OTP ───────────────────────────────────────
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ── REGISTER ───────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, collegeId, email, password, role } = req.body;

    // 1. Check all fields
    if (!name || !collegeId || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Dynamic Department Extraction from College ID (e.g., 2401AI54 -> AI)
    const match = collegeId.match(/[a-zA-Z]+/);
    let department = "Unknown";
    if (match) {
      const code = match[0].toUpperCase();
      const map = {
        "EE": "Electrical",
        "DS": "Data Science",
        "MC": "Mathematics and Computing",
        "ME": "Mech",
        "CS": "CSE",
        "AI": "AI",
        "CE": "Civil",
        "HS": "Humanities"
      };
      if (map[code]) department = map[code];
    }

    // 2. Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email. Must be in format: name_2401ai54@iitp.ac.in"
      });
    }

    // 3. Validate role
    const allowedRoles = ["student", "ta", "professor", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${allowedRoles.join(", ")}`
      });
    }

    // 4. Check duplicate
    const userExists = await User.findOne({ $or: [{ email }, { collegeId }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const hashedOTP = await bcrypt.hash(otp, 10);

    // 7. Save user
    const user = await User.create({
      name,
      collegeId,
      email,
      password: hashedPassword,
      role,
      department,
      otp: hashedOTP,
      otpExpiry
    });

    // 8. Send OTP
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      // Rollback user creation if email fails
      await User.findByIdAndDelete(user._id);
      throw new Error("Failed to send OTP email. Registration was cancelled.");
    }

    res.status(201).json({
      success: true,
      message: `OTP sent to ${email}. Please verify to activate your account.`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── VERIFY OTP ─────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified. Please login." });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please register again." });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Account verified successfully. You can now login."
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── LOGIN ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;

    if (!collegeId || !password) {
      return res.status(400).json({ message: "College ID and password are required" });
    }

    const user = await User.findOne({ collegeId }).select('+password');
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Account not verified. Please verify your OTP to login." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ── JWT includes collegeId ─────────
    const token = jwt.sign(
      { id: user._id, role: user.role, collegeId: user.collegeId, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    user.password = undefined;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
