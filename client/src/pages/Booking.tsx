import { BookingConsole } from "@/components/booking/BookingConsole";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";

export default function Booking() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <PageHero 
          title="Book a Facility"
          subtitle="Reserve your preferred time slot"
          testId="text-booking-title"
        />
        <div className="qd-container py-8">
          <BookingConsole />
        </div>
      </main>
      <Footer />
    </div>
  );
}
