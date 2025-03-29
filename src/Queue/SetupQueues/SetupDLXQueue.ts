// SetupDLXQueue.ts
import amqp from "amqplib";

async function setupDLXChain() {
  const connection = await amqp.connect(
    process.env.AMQP_URL || "amqp://localhost"
  );

  const channel = await connection.createConfirmChannel();

  const retryDelays = process.env.RETRY_DELAYS?.split(",").map(Number) || [
    500, 1000,
  ];

  try {
    // Setup DLX exchange
    const exchange = "retry_dlx_exchange";
    await channel.assertExchange(exchange, "direct", {
      durable: true,
    });

    // Create and bind retry queues
    for (let i = 0; i < retryDelays.length; i++) {
      const queueName = `retry_queue_${i}`;
      const nextQueueName =
        i < retryDelays.length - 1 ? `retry_queue_${i + 1}` : "error_queue";
      const nextExchange =
        i < retryDelays.length - 1 ? exchange : "error_queue_exchange";



      // Create queue with proper DLX settings
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": nextExchange,
          "x-dead-letter-routing-key": nextQueueName,
          "x-message-ttl": retryDelays[i],
        },
      });

      // Bind queue to receive messages
       await channel.bindQueue(
        queueName,
        exchange,
        queueName
      );
      // console.log(`🔗 Bound ${queueName} to ${nextQueueName} via ${exchange}`);
    }

    // Setup error queue
    await channel.assertQueue("error_queue", { durable: true });
    await channel.assertExchange(" error_queue_exchange","direct",{
      durable:true
    })
    await channel.bindQueue("error_queue","error_queue_exchange","");
    console.log("✅ [DLX] Chain setup complete");
  } catch (error) {
    console.error("❌ Error setting up DLX chain:", error);
    throw error;
  } finally {
    await channel.close();
    await connection.close();
  }
}

export default setupDLXChain;


setupDLXChain()