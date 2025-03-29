import amqp from "amqplib";

async function consumeErrorDLQ() {
  let connection: amqp.Connection;
  let channel: amqp.Channel;

  try {
    // Establish Connection
    connection = await amqp.connect(process.env.AMQP_URL || "amqp://localhost:");
    channel = await connection.createChannel();

    // Ensure the error queue exists
    const isErrorQueue = await channel.checkQueue("error_queue");
    if (!isErrorQueue) {
      console.log("NO error queue found 🤦‍♂️");

      return;
    }
    console.log("⚠️ Listening for messages on 'error_queue'...");

    await channel.consume(
      "error_queue",
      async (msg: amqp.ConsumeMessage | null) => {
        if (msg) {
          try {
            console.error(
              "🚨 [Error Queue] Received dead-lettered message:",
              msg.content.toString()
            );
            channel.ack(msg);
            return;
          } catch (processError: any) {
            console.error(
              "❌ Failed to process error message:",
              processError.message
            );

            channel.nack(msg, false, false);
            return;
          }
        }
      }
    );
  } catch (err: any) {
    console.error("❌ Error Consumer Initialization Failed:", err.message);
  } finally {
    // Clean up resources on process exit
    process.on("SIGINT", async () => {
      console.log("🔄 Closing Error Consumer...");
      if (channel) await channel.close();
      if (connection) await connection.close();
      process.exit(0);
    });
  }
}

export default consumeErrorDLQ;
