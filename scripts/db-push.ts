import "dotenv/config";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("Running database push with environment variables loaded...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in environment variables");
    process.exit(1);
  }
  
  console.log("DATABASE_URL is set");
  
  try {
    const { stdout, stderr } = await execAsync("npx drizzle-kit push", {
      env: { ...process.env }
    });
    
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error: any) {
    console.error("Error running drizzle-kit push:", error.message);
    process.exit(1);
  }
}

main();
