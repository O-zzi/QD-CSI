import { BookingConsole } from "@/components/booking/BookingConsole";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Booking() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-booking-title">Book a Facility</h1>
            <p className="text-sm opacity-80">Reserve your preferred time slot</p>
          </div>
        </div>
        <div className="qd-container py-8">
          <BookingConsole />
        </div>
      </main>
      <Footer />
    </div>
  );
}
