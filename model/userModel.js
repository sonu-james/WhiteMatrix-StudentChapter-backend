// import
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,             // ✅ enforce unique emails
    lowercase: true,          // ✅ store all emails lowercase
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  github: {
    type: String,
    default: ""
  },
  linkedin: {
    type: String,
    default: ""
  },
  profile: {
    type: String,
    default: ""
  }
}, { timestamps: true }); // ✅ adds createdAt & updatedAt fields

// ✅ Ensure case-insensitive unique email
userSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const users = mongoose.model("users", userSchema);

module.exports = users;
