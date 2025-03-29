#!/usr/bin/env node
import amqp from "amqplib";
import sendEamil from "../../processors/sendEmail";
import { EmailSchema, type emailType } from "../../schema/zod/email.schema";
import { createNotification } from "../../processors/updateDB";

async function Consumer() {
  const exchange = process.env.AMQP_EXCHANGE || "email_processing_exchange";
  const queueName = process.env.AMQP_QUEUE || "email_processing_queue";
  const routingKey = process.env.AMQP_ROUTING_KEY || "email_task";

  let connection: amqp.Connection;
  let channel: amqp.Channel;

  try {
    // Establish Connection
    connection = await amqp.connect(process.env.AMQP_URL || "amqp://localhost");
    channel = await connection.createChannel();

    // Handle Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`🛑 Received ${signal}. Closing channel and connection...`);
      try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        process.exit(0);
      } catch (shutdownError) {
        console.error(`❌ Error during shutdown:`, shutdownError);
        process.exit(1);
      }
    };

    process.once("SIGINT", () => gracefulShutdown("SIGINT"));
    process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

    // Assert Exchange and Queue
    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "retry_dlx_exchange",
        "x-dead-letter-routing-key": "retry_queue_0",
        "x-overflow": "reject-publish",
      },
    });
    await channel.bindQueue(queueName, exchange, routingKey);

    console.log(
      `✅ Connected to exchange '${exchange}' and queue '${queueName}'`
    );
    console.log(` [*] Waiting for messages. To exit press CTRL+C.`);

    // Start Consuming Messages
    await channel.consume(
      queueName,
      async (message: amqp.ConsumeMessage | null) => {
        if (!message) {
          console.warn("⚠️ Received a null message, skipping...");
          return;
        }

        try {
          console.log(`📩 Received message: ${message.content.toString()}`);

          // Process the video task
          const data: emailType = EmailSchema.parse(
            JSON.parse(message.content.toString())
          );
          const promises = await sendEamil(data, data.sentiment);
          await createNotification(data.userId, data.message);

          // Acknowledge successful processing
          channel.ack(message);
          console.log(`✅ Message processed successfully.`);
        } catch (error: any) {
          console.error(
            "❌ Error processing message:",
            error.message,
            "\nMessage Content:",
            message?.content.toString() || "No message content"
          );

          // Reject and requeue the message (change requeue: false if you don't want it back in the queue)
          channel.nack(message, false, false);
        }
      },
      { noAck: false }
    );
  } catch (err: any) {
    console.error("❌ Consumer initialization failed:", err.message);
  }
}

export default Consumer;
