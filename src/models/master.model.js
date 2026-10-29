const mongoose = require('mongoose');

const masterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dbName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Same central connection as SuperAdmin, so this can be a real ref +
    // .populate('createdBy') unlike MasterUser -> Master below.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Master', masterSchema);
