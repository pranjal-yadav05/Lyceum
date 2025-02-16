import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  visitTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
visitorSchema.index({ ipAddress: 1, userAgent: 1, visitTime: 1 });

// Record a new visit if it's not a refresh
visitorSchema.statics.recordVisit = async function(ip, userAgent) {
  const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds
  const now = Date.now();
  
  // Check if there's a recent visit from this IP and user agent
  const recentVisit = await this.findOne({
    ipAddress: ip,
    userAgent: userAgent,
    visitTime: { $gt: new Date(now - THIRTY_MINUTES) }
  });

  // If no recent visit, create a new record
  if (!recentVisit) {
    return this.create({
      ipAddress: ip,
      userAgent: userAgent
    });
  }
  
  // If recent visit exists, return it without creating a new record
  return recentVisit;
};



const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
