import { db } from "../server/db";
import { users, memberships } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@thequarterdeck.pk";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminQD2026!";
  
  console.log(`\n🔧 Admin Seeding Script for The Quarterdeck\n`);
  console.log(`Checking for existing admin user: ${adminEmail}`);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail.toLowerCase())
  });

  if (existingUser) {
    console.log(`\n⚠️  User already exists with email: ${adminEmail}`);
    
    if (existingUser.role !== 'SUPER_ADMIN') {
      console.log(`Upgrading user role to SUPER_ADMIN...`);
      await db.update(users)
        .set({ 
          role: 'SUPER_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id));
      console.log(`✅ User upgraded to SUPER_ADMIN`);
    } else {
      console.log(`User is already SUPER_ADMIN`);
    }
    
    process.exit(0);
  }

  console.log(`\nCreating new admin user...`);
  
  const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  
  const [newUser] = await db.insert(users).values({
    email: adminEmail.toLowerCase(),
    passwordHash,
    firstName: "Admin",
    lastName: "User",
    role: "SUPER_ADMIN",
    emailVerified: true,
    termsAcceptedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  console.log(`✅ Admin user created with ID: ${newUser.id}`);

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const membershipNumber = `QD-${randomNum}`;
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 10);

  await db.insert(memberships).values({
    userId: newUser.id,
    membershipNumber,
    tier: "FOUNDING",
    status: "ACTIVE",
    validFrom: new Date(),
    validTo,
    guestPasses: 10,
  });

  console.log(`✅ Founding membership created: ${membershipNumber}`);
  
  console.log(`\n🎉 Admin setup complete!`);
  console.log(`\n📋 Login credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n⚠️  Please change the password after first login!`);
  
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("❌ Failed to seed admin user:", error);
  process.exit(1);
});
