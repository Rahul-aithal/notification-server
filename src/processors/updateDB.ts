import Notification from "../models/notificationSchema.model";
export const createNotification = async (userId: string, message: string) => {
  try {
    console.log("Some changes");
    if (!userId || !message) {
      throw new Error("UserId and message are required");
    }

    const notification = await Notification.create({
      userId,
      message,
    });

    await notification.save();
    console.log("👍 Success and Got Object ");
    return notification;
  } catch (error: any) {
    throw new Error(`Upload failed: ${error}`);
  }
};
