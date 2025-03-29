// ConsumerRetryDLX.ts
import amqp from "amqplib";
import sendEamil from "../../processors/sendEmail";
import { EmailSchema, type emailType } from "../../schema/zod/email.schema";
import { createNotification } from "../../processors/updateDB";

async function consumeRetryDLQ() {
  let connection: amqp.Connection;
  let channel: amqp.Channel;

  try {
    connection = await amqp.connect(process.env.AMQP_URL || "amqp://localhost");
    channel = await connection.createChannel();

    const retryDelays = process.env.RETRY_DELAYS?.split(",").map(Number) || [
      500, 1000,
    ];
    const exchange = "retry_dlx_exchange";
    const errorExchange = "error_queue_exchange";
    const errorQueue = "error_queue";

    // ✅ Assert the exchanges
    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertExchange(errorExchange, "direct", { durable: true });

    // ✅ Assert and Bind Error Queue
    await channel.assertQueue(errorQueue, { durable: true });
    await channel.bindQueue(errorQueue, errorExchange, errorQueue);

    for (let i = 0; i < retryDelays.length; i++) {
      const queueName = `retry_queue_${i}`;
      const nextQueueName =
        i < retryDelays.length - 1 ? `retry_queue_${i + 1}` : errorQueue;
      const nextExchange =
        i < retryDelays.length - 1 ? exchange : errorExchange;

      // ✅ Assert Retry Queues
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": nextExchange,
          "x-dead-letter-routing-key": nextQueueName,
          "x-message-ttl": retryDelays[i],
        },
      });

      await channel.bindQueue(queueName, exchange, queueName);

      console.log(`⚠️ Listening for messages on '${queueName}'...`);

      await channel.consume(
        queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg) {
            try {
              const messageContent = msg.content.toString();
              console.log(
                `📝 [Retry Queue ${queueName}] Processing message:`,
                messageContent
              );

              // ✅ Properly Await sendEamil
              const data: emailType = EmailSchema.parse(
                JSON.parse(messageContent)
              );
              const promises = await sendEamil(data, "data.sentiment");
              await createNotification(data.userId, data.message);
              // ✅ Acknowledge on Success
              channel.ack(msg);
              console.log(
                `✅ [Retry Queue ${queueName}] Message processed successfully`
              );
            } catch (processError: any) {
              console.error(
                `❌ [Retry Queue ${queueName}] Processing failed:`,
                processError.message || "Unknown error"
              );

              // ❌ Move to Next Retry Queue
              channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );
    }
  } catch (err: any) {
    console.error("❌ Retry Consumer Initialization Failed:", err.message);
  }

  // ✅ Graceful Shutdown
  process.on("SIGINT", async () => {
    console.log("🔄 Closing Retry Consumer...");
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(0);
  });
}

export default consumeRetryDLQ;

consumeRetryDLQ();
