import Consumer from "../Queue/Conusmers/consumerQueue";
import consumeErrorDLQ from "../Queue/Conusmers/ConsumerErrorDLX";
import consumeRetryDLQ from "../Queue/Conusmers/ConsumerRetryDLX";
import setupDLXChain from "../Queue/SetupQueues/SetupDLXQueue";

class SetUpQueue {
  async initialize() {
    try {
      await setupDLXChain();
      console.log("✅ DLX Chain Setup Complete.");

      await Consumer();
      console.log("✅ Main Consumer Initialized.");

      await consumeRetryDLQ();
      console.log("✅ Retry DLQ Consumer Initialized.");

      await consumeErrorDLQ();
      console.log("✅ Error DLQ Consumer Initialized.");

     
      
    } catch (error: any) {
      console.error("❌ Error during queue setup:", error.message || error);
      throw error;
    }
  }
}

export default SetUpQueue;
