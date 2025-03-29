import mongoose, { Schema, Document, Model } from "mongoose";

export interface Action {
  message: string;
}
export interface Notification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
}

const notificationLogsSchema = new Schema<Notification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensure userId is required
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create the Mongoose model
const Notification: Model<Notification> = mongoose.model<Notification>(
  "Notification",
  notificationLogsSchema
);

export default Notification;
