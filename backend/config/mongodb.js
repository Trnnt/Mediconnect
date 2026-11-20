import mongoose from "mongoose";
import dns from "dns";

// Some local networks pin Node to an unresponsive 127.0.0.1 resolver while
// Windows DNS still works. Keep working DNS servers as a fallback so Atlas SRV
// lookups can resolve.
const DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

const ensureDns = () => {
  try {
    const configured = dns.getServers();
    if (configured.length && !configured.every((server) => /^(127\.|::1$)/.test(server))) {
      return;
    }
    dns.setServers(DNS_SERVERS);
  } catch (error) {
    console.error("DNS setup warning:", error.message);
  }
};

const connectDB = async () => {
  ensureDns();
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/mediconnect`);
    console.log("Database Connected");
  } catch (error) {
    console.error("Database connection error:", error.message);
    console.log("Retrying database connection in 5s...");
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;