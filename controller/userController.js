
const users = require("../model/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// REGISTER CONTROLLER
exports.registerController = async (req, res) => {
  try {
    let { username, email, password, college, role } = req.body;

    // 1️⃣ Validate input
    if (!username || !email || !password || !college) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // 2️⃣ Normalize email (trim + lowercase)
    email = email.trim().toLowerCase();

    // 3️⃣ Check if user already exists (case-insensitive)
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Account already exists" });
    }

    // 4️⃣ Hash password (bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create new user
    const newUser = new users({
      username,
      email,
      password: hashedPassword,
      college,
      role: role || "user", // fallback to default user
      github: "",
      linkedin: "",
      profile: ""
    });

    // 6️⃣ Save to database
    await newUser.save();

    // 7️⃣ Exclude password before sending response
    const { password: _, ...userData } = newUser.toObject();

    res.status(201).json({
      message: "Registration successful 🎉",
      user: userData
    });

  } catch (error) {
    console.error("Registration failed:", error);

    // handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }

    res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
};

//login
exports.loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await users.findOne({ email });
    if (!existingUser) {
      return res.status(406).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET || "supersecretKey",
      { expiresIn: "7d" }
    );

    // ✅ Return in expected structure
    res.status(200).json({
      existingUser: {
        username: existingUser.username,
        email: existingUser.email,
        phone: existingUser.phone || "",
        role: existingUser.role,
      },
      token,
      role: existingUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};


// Temporary in-memory store for OTPs (use Redis in production)
const otpStore = {};
// SEND OTP - with full debug logging
exports.sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporarily (for 5 minutes)
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // Setup mail transporter with debug & logger enabled
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail app password
      },
      logger: true, // logs SMTP activity
      debug: true,  // shows full SMTP traffic
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - Student Chapter",
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Send OTP FULL ERROR:", error);
    console.error("Error Code:", error.code);
    console.error("SMTP Response:", error.response);
    console.error("Stack Trace:", error.stack);

    res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
      code: error.code,
      response: error.response
    });
  }
};


// VERIFY OTP
exports.verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark as verified
    otpStore[email].verified = true;
    console.log("OTP Store after verify:", otpStore);
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// RESET PASSWORD
// RESET PASSWORD
exports.resetPasswordController = async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const otpData = otpStore[email];
    if (!otpData || !otpData.verified) {
      return res.status(400).json({ message: "OTP verification required" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password directly without full validation
    await users.updateOne({ email }, { $set: { password: hashedPassword } });

    delete otpStore[email]; // remove OTP after reset

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};
