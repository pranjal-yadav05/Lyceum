import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  userRegistration: {
    type: Boolean,
    default: true,
  },
  studyRoomEnabled: {
    type: Boolean,
    default: true,
  },
  searchEnabled: {
    type: Boolean,
    default: true,
  },
  maxVideoParticipants: {
    type: Number,
    default: 4,
    min: 2,
    max: 10,
  },
  sessionTimeout: {
    type: Number,
    default: 30,
    min: 5,
    max: 120,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Create a single document for settings
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update settings
settingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.findOne();
  if (!settings) {
    return this.create({ ...updates, updatedBy: userId });
  }

  Object.assign(settings, updates);
  settings.lastUpdated = new Date();
  settings.updatedBy = userId;

  return settings.save();
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
