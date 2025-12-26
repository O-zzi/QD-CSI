import { db } from "../server/db";
import { facilities } from "../shared/schema";
import { eq } from "drizzle-orm";

async function hideBridgeRoom() {
  console.log("Hiding Bridge Room from public facilities view...");

  try {
    const result = await db.update(facilities)
      .set({ isHidden: true })
      .where(eq(facilities.slug, "bridge-room"))
      .returning();

    if (result.length > 0) {
      console.log(`Updated Bridge Room: isHidden = ${result[0].isHidden}`);
    } else {
      console.log("Bridge Room not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Failed to hide Bridge Room:", error);
    process.exit(1);
  }
}

hideBridgeRoom();
