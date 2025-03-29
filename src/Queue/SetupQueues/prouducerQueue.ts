// Producer.ts
import amqp from "amqplib";
import type { emailType } from "../../schema/zod/email.schema";

async function Producer(task: emailType) {
  const exchange = process.env.AMQP_EXCHANGE || "email_processing_exchange";
  const queueName = process.env.AMQP_QUEUE || "email_processing_queue";
  const routingKey = process.env.AMQP_ROUTING_KEY || "email_task";

  let connection;
  try {
    connection = await amqp.connect(process.env.AMQP_URL || "amqp://localhost");
    const channel = await connection.createConfirmChannel();
;
    // Assert exchange and queue
    await channel.assertExchange(exchange, "direct", { durable: true });

    const checkQueue = await channel.checkQueue(queueName);
    if (checkQueue) {
      console.log("Queue already exists");
    }
    console.log("task",task);
    

    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "retry_dlx_exchange",
        "x-dead-letter-routing-key": "retry_queue_0",
        "x-overflow": "reject-publish",
      },
    });

    await channel.bindQueue(queueName, exchange, routingKey);

    const message = JSON.stringify(task);
    const isSent = channel.publish(exchange, routingKey, Buffer.from(message), {
      persistent: true,
      headers: {
        "x-retry-count": 0,
      },
    });

    if (!isSent) {
      throw new Error(`Failed to send message '${routingKey}'`);
    }

    console.log(`✅ [x] Sent '${routingKey}': ${message}`);
    await channel.waitForConfirms();
  } catch (err) {
    console.error("❌ Producer error:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

export default Producer;
