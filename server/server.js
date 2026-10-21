
import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Jourme API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
