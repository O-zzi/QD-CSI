import { seedCmsContent, updateCmsContent } from "../server/seeds/seedCmsContent";

async function main() {
  const args = process.argv.slice(2);
  const forceUpdate = args.includes("--update") || args.includes("-u");

  console.log("Starting CMS content seeding...");
  console.log(`Mode: ${forceUpdate ? "UPDATE (will overwrite existing)" : "CREATE (skip existing)"}`);
  console.log("");

  try {
    if (forceUpdate) {
      const result = await updateCmsContent();
      console.log("\nResult:", result);
    } else {
      const result = await seedCmsContent();
      console.log("\nResult:", result);
    }
    console.log("\nCMS content seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding CMS content:", error);
    process.exit(1);
  }
}

main();
