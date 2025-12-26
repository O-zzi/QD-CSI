import { db } from "../server/db";
import { faqCategories, faqItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedFAQ() {
  console.log("Seeding FAQ data...");

  const categories = [
    { title: "Membership", icon: "users", sortOrder: 1, isActive: true },
    { title: "Bookings", icon: "calendar", sortOrder: 2, isActive: true },
    { title: "Facilities", icon: "building-2", sortOrder: 3, isActive: true },
    { title: "Payments", icon: "credit-card", sortOrder: 4, isActive: true },
  ];

  const faqData: { category: string; questions: { question: string; answer: string }[] }[] = [
    {
      category: "Membership",
      questions: [
        { question: "What membership tiers are available?", answer: "We offer Founding Member, Gold, Silver, and Pay-to-Play options. Each tier has different benefits including booking windows, discounts, and guest passes." },
        { question: "How do I upgrade my membership?", answer: "You can upgrade your membership by visiting your profile page and selecting a new tier. The difference will be prorated for the remaining period." },
        { question: "Can I cancel my membership?", answer: "Yes, you can cancel your membership at any time. A 30-day notice period applies for monthly memberships." },
        { question: "Are there family membership options?", answer: "Yes, family memberships are available for Gold and Founding tiers. Contact our team for details." },
      ]
    },
    {
      category: "Bookings",
      questions: [
        { question: "How far in advance can I book?", answer: "Booking windows vary by membership: Founding Members get 14 days, Gold gets 7 days, Silver gets 5 days, and Pay-to-Play gets 2 days advance booking." },
        { question: "What is the cancellation policy?", answer: "Cancellations must be made at least 24 hours before the scheduled time. Late cancellations or no-shows may result in penalties." },
        { question: "Can I book for guests?", answer: "Yes, members can book for guests using their guest pass allocation. Guest passes vary by membership tier." },
        { question: "How do I reschedule a booking?", answer: "You can reschedule through your profile page or by cancelling and rebooking. The 24-hour cancellation policy applies." },
      ]
    },
    {
      category: "Facilities",
      questions: [
        { question: "What facilities are available?", answer: "We offer Padel Tennis courts, Squash courts, an Air Rifle Range, Bridge Room, Multipurpose Hall, and Cafe/Bar." },
        { question: "Do I need certification for the Air Rifle Range?", answer: "Yes, the Air Rifle Range requires a mandatory safety certification before use. Contact our team to schedule your certification." },
        { question: "Is equipment rental available?", answer: "Yes, equipment rental is available for all facilities. Gold and Founding members receive complimentary rentals as part of their benefits." },
        { question: "What are the operating hours?", answer: "The Quarterdeck operates from 6:00 AM to 10:00 PM daily. Some facilities may have specific timings." },
      ]
    },
    {
      category: "Payments",
      questions: [
        { question: "What payment methods are accepted?", answer: "We accept bank transfers, cash payments, and credit/debit cards. Online payments can be made through our website." },
        { question: "Are there off-peak discounts?", answer: "Yes, members receive discounts on off-peak bookings (10 AM - 5 PM). Discount rates vary by membership tier." },
        { question: "How do booking credits work?", answer: "You can purchase booking credits in advance. Credits are applied automatically to bookings and offer better value than pay-per-use." },
        { question: "Can I get a refund for unused credits?", answer: "Credits are non-refundable but can be transferred to another member with management approval." },
      ]
    }
  ];

  try {
    // Check if FAQ categories already exist
    const existing = await db.select().from(faqCategories);
    if (existing.length > 0) {
      console.log("FAQ categories already exist. Skipping seed...");
      process.exit(0);
    }

    // Seed categories first
    console.log("Creating FAQ categories...");
    for (const cat of categories) {
      const [inserted] = await db.insert(faqCategories).values(cat).returning();
      console.log(`  Created category: ${cat.title} (${inserted.id})`);

      // Find matching questions
      const categoryData = faqData.find(f => f.category === cat.title);
      if (categoryData) {
        console.log(`  Adding ${categoryData.questions.length} questions...`);
        for (let i = 0; i < categoryData.questions.length; i++) {
          const q = categoryData.questions[i];
          await db.insert(faqItems).values({
            categoryId: inserted.id,
            question: q.question,
            answer: q.answer,
            sortOrder: i + 1,
            isActive: true,
          });
        }
      }
    }

    console.log("\nFAQ seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("FAQ seeding failed:", error);
    process.exit(1);
  }
}

seedFAQ();
