import express, { type Request, type Response } from "express";
import SetUpQueue from "./class/QueueSetupClass";
import bodyParser from "body-parser";
// import multer, { type Multer } from "multer";
import type { emailType } from "./schema/zod/email.schema";
import Producer from "./Queue/SetupQueues/prouducerQueue";
import path from "path";
import cors from "cors";
import ConnnectDb from "./db";

// import GetMinioClient from "./Minio";

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
const PORT = process.env.PORT || 3000;

app.use("/client", express.static(path.join(__dirname, "client")));

app.get("/", (req: Request, res: Response) => {
  res.send("🚀 Hello, World! The server is running.");
});

const setUpQueues = async () => {
  try {
    await new SetUpQueue().initialize();
    console.log("✅ Queues and Consumers initialized successfully.");
  } catch (error: any) {
    console.error(
      "❌ Failed to initialize queues and consumers:",
      error.message
    );
    process.exit(1);
  }
};
await setUpQueues();
await ConnnectDb();
app.post("/notify_user", async (req: Request, res: Response): Promise<void> => {
  console.log("notify received");
  try {
    const data = req.body;
    if (!data) {
      res.status(400).json({ error: "No data provided" });
      return;
    }

    console.log(
      "eamil",
      data.email,
      "username",
      data.username,
      "message",
      data.message,
      "userID",
      data.userId,
      "sentiment",
      data.sentiment
    );

    const task: emailType = {
      email: data.email,
      message: data.message,
      name: data.username,
      userId: data.userId,
      sentiment: data.sentiment,
    };
    try {
      await Producer(task);
    } catch (err) {
      console.error("Error in Producer:", err);
      res.status(500).json({ error: "Failed to process task" });
      return;
    }

    console.log("Task successfully queued:", task);
    res.status(200).json({ message: "Success" });
  } catch (error: any) {
    console.error("Error during upload:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is listening at http://localhost:${PORT}`);
});
