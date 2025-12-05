import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPKR, calculateEndTime, isOffPeak } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Target, Dumbbell, Crosshair, Users, Building, 
  Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight,
  MapPin, AlertCircle, Check
} from "lucide-react";
import type { Facility, Booking } from "@shared/schema";

// Configuration
const FACILITIES = [
  { id: 'padel', label: 'Padel Tennis', count: 4, basePrice: 6000, minPlayers: 4, icon: Target, requiresCert: false },
  { id: 'squash', label: 'Squash', count: 2, basePrice: 4000, minPlayers: 2, icon: Dumbbell, requiresCert: false },
  { id: 'air_rifle', label: 'Air Rifle Range', count: 6, basePrice: 6000, minPlayers: 1, icon: Crosshair, requiresCert: true },
  { id: 'bridge', label: 'Bridge Room', count: 5, basePrice: 0, minPlayers: 4, icon: Users, restricted: true, requiresCert: false },
  { id: 'hall', label: 'Multipurpose Hall', count: 1, basePrice: 6000, minPlayers: 10, icon: Building, requiresCert: false },
];

const FACILITY_ADD_ONS: Record<string, Array<{ id: string; label: string; price: number; icon: string }>> = {
  padel: [
    { id: 'racket', label: 'Rent Racket', price: 500, icon: 'racket' },
    { id: 'balls', label: 'Sleeve of Balls', price: 1500, icon: 'ball' },
    { id: 'water', label: 'Mineral Water', price: 100, icon: 'water' },
    { id: 'towel', label: 'Fresh Towel', price: 300, icon: 'towel' },
  ],
  squash: [
    { id: 'sq_racket', label: 'Squash Racket Rental', price: 500, icon: 'racket' },
    { id: 'sq_balls', label: 'Squash Balls (Tube)', price: 1200, icon: 'ball' },
    { id: 'water', label: 'Mineral Water', price: 100, icon: 'water' },
    { id: 'towel', label: 'Fresh Towel', price: 300, icon: 'towel' },
  ],
  air_rifle: [
    { id: 'ear_protection', label: 'Ear Protection', price: 300, icon: 'headphones' },
    { id: 'safety_glasses', label: 'Safety Glasses', price: 400, icon: 'glasses' },
    { id: 'water', label: 'Mineral Water', price: 100, icon: 'water' },
  ],
  bridge: [
    { id: 'tea_coffee', label: 'Tea / Coffee Service', price: 300, icon: 'coffee' },
    { id: 'snacks', label: 'Snacks Platter', price: 800, icon: 'food' },
    { id: 'water', label: 'Mineral Water', price: 100, icon: 'water' },
  ],
  hall: [
    { id: 'mats', label: 'Floor Mats', price: 500, icon: 'mat' },
    { id: 'speaker', label: 'Speaker & Mic Setup', price: 1500, icon: 'speaker' },
    { id: 'water', label: 'Mineral Water', price: 100, icon: 'water' },
  ],
};

const VENUES = ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi'];
const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const MOCK_MEMBERSHIP_NUMBERS = ['QD-0001', 'QD-0002', 'QD-0003', 'QD-0004', 'QD-0005'];

interface BookingConsoleProps {
  initialView?: 'booking' | 'events' | 'leaderboard' | 'profile';
}

export function BookingConsole({ initialView = 'booking' }: BookingConsoleProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedFacility, setSelectedFacility] = useState(FACILITIES[0]);
  const [selectedVenue, setSelectedVenue] = useState('Islamabad');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedResourceId, setSelectedResourceId] = useState(1);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credits'>('cash');
  const [payerType, setPayerType] = useState<'self' | 'member'>('self');
  const [payerMembershipNumber, setPayerMembershipNumber] = useState('');
  const [payerMembershipValid, setPayerMembershipValid] = useState<boolean | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [coachBooked, setCoachBooked] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [currentGroupSize, setCurrentGroupSize] = useState(1);

  // Fetch existing bookings for the selected date
  const { data: existingBookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', selectedFacility.id, selectedDate],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setSelectedStartTime(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if slot is taken
  const isSlotTaken = (time: string) => {
    return existingBookings.some(
      (b) =>
        b.date === selectedDate &&
        b.resourceId === selectedResourceId &&
        b.startTime === time &&
        b.status !== 'CANCELLED'
    );
  };

  // Handle membership number validation
  const handleMembershipNumberChange = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    setPayerMembershipNumber(trimmed);
    if (!trimmed) {
      setPayerMembershipValid(null);
    } else {
      setPayerMembershipValid(MOCK_MEMBERSHIP_NUMBERS.includes(trimmed));
    }
  };

  // Calculate booking summary
  const bookingSummary = useMemo(() => {
    if (!selectedStartTime) return null;
    const fac = selectedFacility;
    const perMinutePrice = fac.basePrice / 60;
    let base = perMinutePrice * selectedDuration;
    let discount = 0;
    if (isOffPeak(selectedStartTime)) discount = base * 0.3;
    const addOnList = FACILITY_ADD_ONS[fac.id] || [];
    let addOnTotal = 0;
    selectedAddOns.forEach((id) => {
      const item = addOnList.find((a) => a.id === id);
      if (item) {
        const qty = addOnQuantities[id] ?? 1;
        addOnTotal += item.price * qty;
      }
    });
    if (coachBooked) addOnTotal += 4000;
    return {
      basePrice: Math.round(base),
      discount: Math.round(discount),
      addOnTotal,
      totalPrice: Math.round(base - discount + addOnTotal),
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: calculateEndTime(selectedStartTime, selectedDuration),
    };
  }, [selectedStartTime, selectedFacility, selectedDuration, selectedAddOns, addOnQuantities, coachBooked, selectedDate]);

  // Toggle add-on
  const toggleAddOn = (item: { id: string }) => {
    const newSet = new Set(selectedAddOns);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
      setAddOnQuantities((prev) => ({
        ...prev,
        [item.id]: prev[item.id] ?? 1,
      }));
    }
    setSelectedAddOns(newSet);
  };

  // Change add-on quantity
  const changeAddOnQuantity = (id: string, delta: number) => {
    setAddOnQuantities((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.min(10, Math.max(1, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Confirm booking
  const confirmBooking = () => {
    if (!bookingSummary || !selectedStartTime) return;

    createBookingMutation.mutate({
      facilitySlug: selectedFacility.id,
      venue: selectedVenue,
      resourceId: selectedResourceId,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: bookingSummary.endTime,
      durationMinutes: selectedDuration,
      paymentMethod,
      payerType: payerType.toUpperCase(),
      payerMembershipNumber: payerType === 'member' ? payerMembershipNumber : null,
      basePrice: bookingSummary.basePrice,
      discount: bookingSummary.discount,
      addOnTotal: bookingSummary.addOnTotal,
      totalPrice: bookingSummary.totalPrice,
      coachBooked,
      isMatchmaking,
      currentPlayers: currentGroupSize,
      maxPlayers: selectedFacility.minPlayers,
      addOns: Array.from(selectedAddOns).map((id) => ({
        id,
        quantity: addOnQuantities[id] ?? 1,
      })),
    });
  };

  const FacilityIcon = selectedFacility.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="qd-container py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold" data-testid="text-console-title">Booking Console</h1>
                <p className="text-xs text-muted-foreground">
                  Interactive console to check availability and book facilities
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="hidden md:flex bg-gray-100 dark:bg-slate-700 rounded-full p-1">
                {['booking', 'events', 'leaderboard'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view as any)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      currentView === view
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`button-view-${view}`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              
              {isAuthenticated && (
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="rounded-full" data-testid="button-my-profile">
                    {user?.firstName || 'Profile'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="qd-container py-2 flex gap-2 overflow-x-auto">
          {['booking', 'events', 'leaderboard'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                currentView === view
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground'
              }`}
              data-testid={`button-mobile-view-${view}`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="qd-container py-8">
        {/* BOOKING VIEW */}
        {currentView === 'booking' && (
          <div className="animate-qd-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Facility & Options */}
              <div className="md:col-span-2 space-y-6">
                {/* Facility Selection */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-sm text-muted-foreground">1. Select Facility & Venue</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-transparent"
                        data-testid="select-venue"
                      >
                        {VENUES.map((venue) => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {FACILITIES.map((fac) => {
                      const Icon = fac.icon;
                      const isSelected = selectedFacility.id === fac.id;
                      return (
                        <button
                          key={fac.id}
                          onClick={() => {
                            setSelectedFacility(fac);
                            setSelectedResourceId(1);
                            setSelectedStartTime(null);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-400'
                          }`}
                          data-testid={`button-facility-${fac.id}`}
                        >
                          <Icon className="w-4 h-4" />
                          {fac.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Court Selection */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Court / Lane</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: selectedFacility.count }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => {
                            setSelectedResourceId(i + 1);
                            setSelectedStartTime(null);
                          }}
                          className={`w-12 h-12 rounded-xl border text-sm font-bold transition ${
                            selectedResourceId === i + 1
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-400'
                          }`}
                          data-testid={`button-resource-${i + 1}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm text-muted-foreground mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">
                    2. Booking Options
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Open Matchmaking?</Label>
                      <Switch
                        checked={isMatchmaking}
                        onCheckedChange={setIsMatchmaking}
                        data-testid="switch-matchmaking"
                      />
                    </div>
                    {isMatchmaking && (
                      <select
                        value={currentGroupSize}
                        onChange={(e) => setCurrentGroupSize(parseInt(e.target.value))}
                        className="w-full p-2 border rounded-lg text-sm bg-sky-50 dark:bg-sky-900/30 border-amber-200 dark:border-amber-700"
                        data-testid="select-group-size"
                      >
                        <option value={1}>Just Me (1)</option>
                        <option value={2}>Pair (2)</option>
                        <option value={3}>Three (3)</option>
                      </select>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
                      <Label className="text-sm">Book a coach?</Label>
                      <Switch
                        checked={coachBooked}
                        onCheckedChange={setCoachBooked}
                        data-testid="switch-coach"
                      />
                    </div>
                    {coachBooked && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold text-right">
                        +4,000 PKR
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-sm text-muted-foreground">3. Select Time Slot</h3>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Date</label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedStartTime(null);
                        }}
                        className="text-xs"
                        data-testid="input-date"
                      />
                    </div>
                  </div>
                  
                  {/* Duration Selection */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[60, 90, 120].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => {
                          setSelectedDuration(duration);
                          setSelectedStartTime(null);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          selectedDuration === duration
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground hover:bg-gray-200'
                        }`}
                        data-testid={`button-duration-${duration}`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const taken = isSlotTaken(time);
                      const isSelected = selectedStartTime === time;
                      const offPeak = isOffPeak(time);
                      
                      return (
                        <button
                          key={time}
                          onClick={() => !taken && setSelectedStartTime(time)}
                          disabled={taken}
                          className={`relative py-3 rounded-lg border text-sm font-medium transition ${
                            taken
                              ? 'bg-gray-200 dark:bg-slate-600 text-muted-foreground cursor-not-allowed opacity-70'
                              : isSelected
                              ? 'bg-green-500 text-white shadow-lg border-green-500'
                              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-sky-400'
                          }`}
                          data-testid={`button-time-${time.replace(':', '')}`}
                        >
                          {time}
                          {offPeak && !taken && !isSelected && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-1" />
                    Green dot = Off-peak (30% discount)
                  </p>
                </div>
              </div>

              {/* Right Column - Summary & Payment */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-sky-500">
                  <h3 className="font-bold text-lg mb-4">4. Extras & Payment</h3>
                  
                  {bookingSummary ? (
                    <>
                      {/* Add-ons */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Add-ons</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {(FACILITY_ADD_ONS[selectedFacility.id] || []).map((item) => {
                            const selected = selectedAddOns.has(item.id);
                            const qty = addOnQuantities[item.id] ?? 1;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleAddOn(item)}
                                className={`flex-shrink-0 border rounded-xl px-4 py-3 flex items-center gap-2 text-sm transition hover:shadow-sm ${
                                  selected 
                                    ? 'bg-sky-50 dark:bg-sky-900/30 border-amber-500 text-amber-800 dark:text-amber-300' 
                                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                                }`}
                                data-testid={`button-addon-${item.id}`}
                              >
                                <div className="text-left">
                                  <p className="font-semibold text-xs">{item.label}</p>
                                  <p className="text-[10px] text-muted-foreground">Rs {item.price}</p>
                                </div>
                                {selected && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); changeAddOnQuantity(item.id, -1); }}
                                      className="w-5 h-5 rounded-full border flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-semibold w-4 text-center">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); changeAddOnQuantity(item.id, 1); }}
                                      className="w-5 h-5 rounded-full border flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payer Details */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Payer Details</h4>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-4 text-xs">
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name="payer-type"
                                value="self"
                                checked={payerType === 'self'}
                                onChange={() => setPayerType('self')}
                              />
                              <span>Self</span>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name="payer-type"
                                value="member"
                                checked={payerType === 'member'}
                                onChange={() => setPayerType('member')}
                              />
                              <span>Another member</span>
                            </label>
                          </div>
                          {payerType === 'member' && (
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={payerMembershipNumber}
                                onChange={(e) => handleMembershipNumberChange(e.target.value)}
                                placeholder="e.g. QD-0001"
                                className="text-xs"
                                data-testid="input-payer-membership"
                              />
                              {payerMembershipValid === true && (
                                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Membership found
                                </p>
                              )}
                              {payerMembershipValid === false && (
                                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Membership not found
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 border-t pt-4">Summary</h4>
                      <div className="space-y-1 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Rate ({selectedDuration} min)</span>
                          <span>{formatPKR(bookingSummary.basePrice)}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span className="text-muted-foreground">Off-Peak Discount (30%)</span>
                          <span>- {formatPKR(bookingSummary.discount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Add-Ons & Coach</span>
                          <span>+ {formatPKR(bookingSummary.addOnTotal)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-dashed pt-3">
                        <span className="font-bold text-lg">TOTAL DUE</span>
                        <span className="font-extrabold text-2xl text-sky-700 dark:text-sky-400">
                          {formatPKR(bookingSummary.totalPrice)}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="mt-6">
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                          Payment Method
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex-grow px-3 py-2 rounded-lg text-sm font-medium transition border ${
                              paymentMethod === 'cash'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-50'
                            }`}
                            data-testid="button-payment-cash"
                          >
                            Cash/Card (On-Site)
                          </button>
                          <button
                            onClick={() => setPaymentMethod('credits')}
                            className={`flex-grow px-3 py-2 rounded-lg text-sm font-medium transition border ${
                              paymentMethod === 'credits'
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-50'
                            }`}
                            data-testid="button-payment-credits"
                          >
                            Credits
                          </button>
                        </div>
                      </div>

                      <Button
                        onClick={confirmBooking}
                        disabled={createBookingMutation.isPending}
                        className="w-full mt-6 py-3 rounded-xl font-bold"
                        data-testid="button-confirm-booking"
                      >
                        {createBookingMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                      </Button>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground italic text-sm py-8">
                      Please select a time slot to calculate price.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVENTS VIEW */}
        {currentView === 'events' && <EventsView />}

        {/* LEADERBOARD VIEW */}
        {currentView === 'leaderboard' && <LeaderboardView />}
      </div>
    </div>
  );
}

// Events View Component
function EventsView() {
  const MOCK_EVENTS = [
    { id: 'e1', type: 'Academy', facility: 'padel', title: 'Junior Padel Academy (U-18)', instructor: 'Coach Faraz', day: 'Mon/Wed', time: '4:00 PM', pricePKR: 20000, description: 'Elite two-session per week coaching.' },
    { id: 'e2', type: 'Tournament', facility: 'padel', title: 'Padel Doubles Clash', instructor: 'Event Team', day: 'Sat', time: '10:00 AM', pricePKR: 5000, description: 'Monthly open doubles tournament.' },
    { id: 'e3', type: 'Class', facility: 'squash', title: 'Squash Conditioning Drills', instructor: 'Coach Adil', day: 'Tue', time: '7:00 PM', pricePKR: 1500, description: 'High-intensity drills for intermediates.' },
    { id: 'e4', type: 'Social', facility: 'squash', title: 'Squash Mixer Night', instructor: 'Social Host', day: 'Fri', time: '8:00 PM', pricePKR: 500, description: 'Casual rotating partner sessions.' },
    { id: 'e5', type: 'Academy', facility: 'air_rifle', title: 'Marksman Certification', instructor: 'Sgt. Retired', day: 'Mon/Thurs', time: '5:00 PM', pricePKR: 2000, description: 'Safety and proficiency certification.' },
  ];

  const { toast } = useToast();
  
  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'Academy': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Tournament': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'Class': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Social': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-qd-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold" data-testid="text-events-title">Events & Academy</h2>
        <p className="text-muted-foreground mt-2 text-sm">Classes, tournaments and social events – preview only.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EVENTS.map((event) => (
          <div 
            key={event.id} 
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col justify-between"
            data-testid={`card-event-${event.id}`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`${getEventTypeClass(event.type)} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                  {event.type}
                </span>
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">{formatPKR(event.pricePKR)}</span>
              </div>
              <h4 className="font-bold text-lg mb-1">{event.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {event.day} at {event.time}
              </p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
            <div className="flex justify-between items-center mt-4 border-t pt-3 border-gray-100 dark:border-slate-700">
              <span className="text-xs text-muted-foreground">Instructor: {event.instructor}</span>
              <Button
                size="sm"
                onClick={() => toast({ title: 'Event Registration', description: `Simulating registration for: ${event.title}` })}
                data-testid={`button-register-${event.id}`}
              >
                Register
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Leaderboard View Component
function LeaderboardView() {
  const [currentType, setCurrentType] = useState('cumulative');
  
  const LEADERBOARD_DATA: Record<string, Array<{ name: string; points: number; tier: string }>> = {
    cumulative: [
      { name: 'Major Hamza', points: 1240, tier: 'Founding' },
      { name: 'Sarah Khan', points: 980, tier: 'Gold' },
      { name: 'Ali Raza', points: 850, tier: 'Silver' },
      { name: 'TechSol Team', points: 720, tier: 'Corporate' },
      { name: 'Asif Nadeem', points: 610, tier: 'Silver' },
    ],
    padel: [
      { name: 'Sarah Khan', points: 450, tier: 'Gold' },
      { name: 'Ali Raza', points: 310, tier: 'Silver' },
      { name: 'Major Hamza', points: 290, tier: 'Founding' },
    ],
    squash: [
      { name: 'Asif Nadeem', points: 300, tier: 'Silver' },
      { name: 'Major Hamza', points: 150, tier: 'Founding' },
    ],
    air_rifle: [
      { name: 'Major Hamza', points: 500, tier: 'Founding' },
      { name: 'TechSol Team', points: 300, tier: 'Corporate' },
    ],
  };

  const currentLeaderboard = LEADERBOARD_DATA[currentType] || [];

  return (
    <div className="max-w-4xl mx-auto animate-qd-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold" data-testid="text-leaderboard-title">Quarterdeck Leaderboards</h2>
        <p className="text-muted-foreground mt-2 text-sm">Top players across all facilities.</p>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {['cumulative', 'padel', 'squash', 'air_rifle'].map((type) => (
          <button
            key={type}
            onClick={() => setCurrentType(type)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${
              currentType === type
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg'
                : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100'
            }`}
            data-testid={`button-leaderboard-${type}`}
          >
            {type === 'cumulative' ? 'All Sports' : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
          <h3 className="font-extrabold text-lg">
            {currentType === 'cumulative' ? 'Global Arena Leaderboard' : `${currentType.charAt(0).toUpperCase() + currentType.slice(1).replace('_', ' ')} Top Scorers`}
          </h3>
        </div>
        {currentLeaderboard.length > 0 ? (
          currentLeaderboard.map((player, i) => (
            <div 
              key={player.name} 
              className="flex items-center p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              data-testid={`leaderboard-entry-${i}`}
            >
              <div className={`w-10 text-center font-extrabold text-xl ${i === 0 ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground'}`}>
                #{i + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-xl shadow-inner">
                {player.name.charAt(0)}
              </div>
              <div className="flex-grow ml-4">
                <h4 className="font-bold">{player.name}</h4>
                <span className="text-[10px] bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded">{player.tier}</span>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-sky-700 dark:text-sky-400 text-xl">{player.points}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Score</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground italic">
            No ranking data for this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
