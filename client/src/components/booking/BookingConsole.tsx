import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPKR, calculateEndTime, isOffPeak } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Crosshair, Building2, Spade,
  Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight,
  MapPin, AlertCircle, Check, Wallet, Timer, Ticket,
  Trophy, User, CalendarDays, Minus, Plus,
  Headphones, Glasses, Droplets, Coffee, Speaker, CircleDot,
  ShieldCheck, FileCheck, Target
} from "lucide-react";
import { GiTennisRacket, GiSquare } from "react-icons/gi";
import type { Facility, Booking } from "@shared/schema";

import padelRacketImg from "@assets/stock_images/padel_tennis_racket__27bc6fce.jpg";
import sportsBallsImg from "@assets/stock_images/sports_balls_tennis__26c570e1.jpg";
import mineralWaterImg from "@assets/stock_images/bottled_mineral_wate_edb6abad.jpg";
import freshTowelImg from "@assets/stock_images/white_sports_towel_f_fbcf5ab6.jpg";
import earProtectionImg from "@assets/stock_images/ear_protection_muffs_a1e17b4f.jpg";
import safetyGlassesImg from "@assets/stock_images/safety_glasses_prote_791951bd.jpg";
import teaCoffeeImg from "@assets/stock_images/tea_coffee_service_c_4144e519.jpg";
import snacksPlatterImg from "@assets/stock_images/snacks_platter_appet_922ac906.jpg";
import floorMatsImg from "@assets/stock_images/yoga_floor_exercise__ef8642d4.jpg";
import speakerMicImg from "@assets/stock_images/microphone_speaker_a_0daceca0.jpg";
import squashRacketImg from "@assets/stock_images/squash_racket_sports_6d7b2f44.jpg";

// Icon mapping for facilities based on slug
const FACILITY_ICONS: Record<string, typeof GiTennisRacket> = {
  'padel-tennis': GiTennisRacket,
  'squash': GiSquare,
  'air-rifle-range': Crosshair,
  'bridge-room': Spade,
  'multipurpose-hall': Building2,
};

// Default fallback facilities (only used if API fails)
const DEFAULT_FACILITIES = [
  { id: 'padel-tennis', label: 'Padel Tennis', count: 3, basePrice: 6000, minPlayers: 4, icon: GiTennisRacket, requiresCert: false },
  { id: 'squash', label: 'Squash Courts', count: 2, basePrice: 4000, minPlayers: 2, icon: GiSquare, requiresCert: false },
  { id: 'air-rifle-range', label: 'Air Rifle Range', count: 6, basePrice: 6000, minPlayers: 1, icon: Crosshair, requiresCert: true },
  { id: 'bridge-room', label: 'Bridge Room', count: 5, basePrice: 0, minPlayers: 4, icon: Spade, restricted: true, requiresCert: false },
  { id: 'multipurpose-hall', label: 'Multipurpose Hall', count: 1, basePrice: 6000, minPlayers: 10, icon: Building2, requiresCert: false },
];

type AddOn = { id: string; label: string; price: number; icon: typeof Target; image: string };
const FACILITY_ADD_ONS: Record<string, AddOn[]> = {
  'padel-tennis': [
    { id: 'racket', label: 'Rent Racket', price: 500, icon: Target, image: padelRacketImg },
    { id: 'balls', label: 'Sleeve of Balls', price: 1500, icon: CircleDot, image: sportsBallsImg },
    { id: 'water', label: 'Mineral Water', price: 100, icon: Droplets, image: mineralWaterImg },
    { id: 'towel', label: 'Fresh Towel', price: 300, icon: ShieldCheck, image: freshTowelImg },
  ],
  'squash': [
    { id: 'sq_racket', label: 'Squash Racket Rental', price: 500, icon: Target, image: squashRacketImg },
    { id: 'sq_balls', label: 'Squash Balls (Tube)', price: 1200, icon: CircleDot, image: sportsBallsImg },
    { id: 'water', label: 'Mineral Water', price: 100, icon: Droplets, image: mineralWaterImg },
    { id: 'towel', label: 'Fresh Towel', price: 300, icon: ShieldCheck, image: freshTowelImg },
  ],
  'air-rifle-range': [
    { id: 'ear_protection', label: 'Ear Protection', price: 300, icon: Headphones, image: earProtectionImg },
    { id: 'safety_glasses', label: 'Safety Glasses', price: 400, icon: Glasses, image: safetyGlassesImg },
    { id: 'water', label: 'Mineral Water', price: 100, icon: Droplets, image: mineralWaterImg },
  ],
  'bridge-room': [
    { id: 'tea_coffee', label: 'Tea / Coffee Service', price: 300, icon: Coffee, image: teaCoffeeImg },
    { id: 'snacks', label: 'Snacks Platter', price: 800, icon: ShieldCheck, image: snacksPlatterImg },
    { id: 'water', label: 'Mineral Water', price: 100, icon: Droplets, image: mineralWaterImg },
  ],
  'multipurpose-hall': [
    { id: 'mats', label: 'Floor Mats', price: 500, icon: ShieldCheck, image: floorMatsImg },
    { id: 'speaker', label: 'Speaker & Mic Setup', price: 1500, icon: Speaker, image: speakerMicImg },
    { id: 'water', label: 'Mineral Water', price: 100, icon: Droplets, image: mineralWaterImg },
  ],
};

// Default fallback values (only used if API fails)
const DEFAULT_VENUES = ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi'];
const DEFAULT_TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const MOCK_MEMBERSHIP_NUMBERS = ['QD-0001', 'QD-0002', 'QD-0003', 'QD-0004', 'QD-0005'];

const DEFAULT_HALL_ACTIVITIES = [
  { value: 'Training', label: 'Team Training' },
  { value: 'Event', label: 'Private Event/Party' },
  { value: 'General', label: 'General Practice' },
];

interface VenueData {
  id: string;
  slug: string;
  name: string;
  city: string;
}

interface HallActivityData {
  id: string;
  name: string;
  description: string | null;
}

interface FacilityAddOnData {
  id: string;
  facilityId: string;
  label: string;
  price: number;
  icon: string | null;
  imageUrl: string | null;
}

const MOCK_EVENTS = [
  { id: 'e1', type: 'Academy', facility: 'padel-tennis', title: 'Junior Padel Academy (U-18)', instructor: 'Coach Faraz', day: 'Mon/Wed', time: '4:00 PM', pricePKR: 20000, description: 'Elite two-session per week coaching focusing on technique and match play.' },
  { id: 'e2', type: 'Tournament', facility: 'padel-tennis', title: 'Padel Doubles Clash', instructor: 'Event Team', day: 'Sat', time: '10:00 AM', pricePKR: 5000, description: 'Monthly open doubles tournament for all Gold/Founding members.' },
  { id: 'e3', type: 'Class', facility: 'squash', title: 'Squash Conditioning Drills', instructor: 'Coach Adil', day: 'Tue', time: '7:00 PM', pricePKR: 1500, description: 'High-intensity drills focused on footwork and stamina for intermediate players.' },
  { id: 'e4', type: 'Social', facility: 'squash', title: 'Squash Mixer Night', instructor: 'Social Host', day: 'Fri', time: '8:00 PM', pricePKR: 500, description: 'Casual, rotating partner sessions. Great for meeting new opponents.' },
  { id: 'e5', type: 'Academy', facility: 'air-rifle-range', title: 'Marksman Certification', instructor: 'Sgt. Retired', day: 'Mon/Thurs', time: '5:00 PM', pricePKR: 2000, description: 'Mandatory 30-minute safety and proficiency certification class.' },
  { id: 'e6', type: 'Tournament', facility: 'air-rifle-range', title: 'Precision Challenge', instructor: 'Range Master', day: 'Sun', time: '2:00 PM', pricePKR: 3000, description: 'Monthly competition for the highest grouping score. Prizes for the top 3.' },
  { id: 'e7', type: 'Class', facility: 'bridge-room', title: 'Beginner Bridge Workshop', instructor: 'Ms. Saadia', day: 'Wed', time: '11:00 AM', pricePKR: 500, description: 'Learn the basics of bidding and conventions in a friendly group setting.' },
  { id: 'e8', type: 'Social', facility: 'bridge-room', title: 'Contract Bridge Social', instructor: 'Social Host', day: 'Sat', time: '3:00 PM', pricePKR: 0, description: 'Open table social for Founders and Referrals. Free to attend.' },
  { id: 'e9', type: 'Class', facility: 'multipurpose-hall', title: 'Morning Aerobics', instructor: 'Ms. Sara', day: 'Mon/Wed/Fri', time: '10:00 AM', pricePKR: 1500, description: 'High-energy fitness class suitable for all levels.' },
  { id: 'e10', type: 'Academy', facility: 'multipurpose-hall', title: 'PR/Corporate Event Booking', instructor: 'Management', day: 'Any', time: 'Any', pricePKR: 150000, description: 'Book the entire hall for private corporate functions, product launches, or large group training.' },
];

const LEADERBOARD_DATA: Record<string, Array<{ name: string; points: number; tier: string; facility?: string }>> = {
  cumulative: [
    { name: 'Major Hamza', points: 1240, tier: 'Founding' },
    { name: 'Sarah Khan', points: 980, tier: 'Gold' },
    { name: 'Ali Raza', points: 850, tier: 'Silver' },
    { name: 'TechSol Team', points: 720, tier: 'Corporate' },
    { name: 'Asif Nadeem', points: 610, tier: 'Silver' },
  ],
  'padel-tennis': [
    { name: 'Sarah Khan', points: 450, tier: 'Gold', facility: 'padel-tennis' },
    { name: 'Ali Raza', points: 310, tier: 'Silver', facility: 'padel-tennis' },
    { name: 'Major Hamza', points: 290, tier: 'Founding', facility: 'padel-tennis' },
    { name: 'Waseem Akram', points: 200, tier: 'Silver', facility: 'padel-tennis' },
  ],
  'squash': [
    { name: 'Asif Nadeem', points: 300, tier: 'Silver', facility: 'squash' },
    { name: 'Major Hamza', points: 150, tier: 'Founding', facility: 'squash' },
    { name: 'Kamran Ali', points: 110, tier: 'Corporate', facility: 'squash' },
  ],
  'air-rifle-range': [
    { name: 'Major Hamza', points: 500, tier: 'Founding', facility: 'air-rifle-range' },
    { name: 'TechSol Team', points: 300, tier: 'Corporate', facility: 'air-rifle-range' },
    { name: 'Sarah Khan', points: 280, tier: 'Gold', facility: 'air-rifle-range' },
  ],
};

const MOCK_USER_PROFILE = {
  creditBalance: 150000,
  totalHoursPlayed: 45,
  guestPasses: 5,
  membershipTier: 'Founding',
  isSafetyCertified: true,
  hasSignedWaiver: true,
};

interface BookingConsoleProps {
  initialView?: 'booking' | 'events' | 'leaderboard' | 'profile';
}

export function BookingConsole({ initialView = 'booking' }: BookingConsoleProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedFacility, setSelectedFacility] = useState(DEFAULT_FACILITIES[0]);
  const [selectedVenue, setSelectedVenue] = useState('Islamabad');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedResourceId, setSelectedResourceId] = useState(1);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credits'>('cash');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [payerType, setPayerType] = useState<'self' | 'member'>('self');
  const [payerMembershipNumber, setPayerMembershipNumber] = useState('');
  const [payerMembershipValid, setPayerMembershipValid] = useState<boolean | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [coachBooked, setCoachBooked] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [currentGroupSize, setCurrentGroupSize] = useState(1);
  const [selectedHallActivity, setSelectedHallActivity] = useState<string | null>(null);
  const [currentLeaderboardType, setCurrentLeaderboardType] = useState('cumulative');

  const userProfile = isAuthenticated && user ? {
    ...MOCK_USER_PROFILE,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member',
    email: user.email || '',
  } : MOCK_USER_PROFILE;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (success === 'true' && sessionId) {
      apiRequest('POST', '/api/stripe/verify-session', { sessionId })
        .then((response) => response.json())
        .then((data) => {
          if (data.booking) {
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed and paid.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          }
        })
        .catch((error) => {
          toast({
            title: "Payment Verification Failed",
            description: error.message || "Please contact support if your payment was deducted.",
            variant: "destructive",
          });
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made.",
        variant: "default",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const { data: existingBookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', selectedFacility.id, selectedDate],
  });

  // Fetch events from API
  interface EventData {
    id: string;
    title: string;
    description: string;
    type: string;
    scheduleDay: string;
    scheduleTime: string;
    instructor: string | null;
    price: number;
    capacity: number;
    enrolledCount: number;
    facilityId: string;
  }

  // Fetch facilities from API to map IDs to slugs
  const { data: apiFacilities = [] } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/facilities');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch venues from API
  const { data: apiVenues = [] } = useQuery<VenueData[]>({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/venues');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch hall activities from API
  const { data: apiHallActivities = [] } = useQuery<HallActivityData[]>({
    queryKey: ['/api/hall-activities'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/hall-activities');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  // Transform venues to simple city list
  const VENUES = useMemo(() => {
    if (apiVenues.length === 0) return DEFAULT_VENUES;
    return apiVenues.map(v => v.city);
  }, [apiVenues]);

  // Transform hall activities
  const HALL_ACTIVITIES = useMemo(() => {
    if (apiHallActivities.length === 0) return DEFAULT_HALL_ACTIVITIES;
    return apiHallActivities.map(a => ({
      value: a.name,
      label: a.name,
    }));
  }, [apiHallActivities]);

  // Fetch operating hours for selected date's day of week and facility
  // selectedDate is an ISO string like "2025-12-21", need to parse it to get day of week
  const selectedDayOfWeek = useMemo(() => {
    const date = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid timezone issues
    return date.getDay();
  }, [selectedDate]);
  
  interface OperatingHoursData {
    id: string;
    venueId: string | null;
    facilityId: string | null;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number | null;
    isHoliday: boolean | null;
    isClosed: boolean | null;
  }
  
  // Get the database facility ID for the selected facility slug
  const selectedFacilityDbId = useMemo(() => {
    const facility = apiFacilities.find(f => f.slug === selectedFacility.id);
    return facility?.id || null;
  }, [apiFacilities, selectedFacility.id]);
  
  // Get the venue ID for the selected city/venue
  const selectedVenueDbId = useMemo(() => {
    const venue = apiVenues.find(v => v.city === selectedVenue);
    return venue?.id || null;
  }, [apiVenues, selectedVenue]);
  
  // Fetch ALL operating hours for the day (no facility/venue filter) to allow client-side priority selection
  const { data: apiOperatingHours = [] } = useQuery<OperatingHoursData[]>({
    queryKey: ['/api/operating-hours', selectedDayOfWeek],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/operating-hours?dayOfWeek=${selectedDayOfWeek}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
  
  // Generate time slots dynamically from operating hours or use defaults
  const TIME_SLOTS = useMemo(() => {
    // Priority: 1) facility-specific hours (only if we have a facility ID), 2) venue-specific hours, 3) generic day hours, 4) defaults
    const facilityHours = selectedFacilityDbId 
      ? apiOperatingHours.find(h => !h.isClosed && !h.isHoliday && h.facilityId === selectedFacilityDbId)
      : null;
    const venueHours = selectedVenueDbId
      ? apiOperatingHours.find(h => !h.isClosed && !h.isHoliday && h.venueId === selectedVenueDbId && !h.facilityId)
      : null;
    const genericHours = apiOperatingHours.find(h => 
      !h.isClosed && !h.isHoliday && !h.facilityId && !h.venueId
    );
    const relevantHours = facilityHours || venueHours || genericHours;
    
    if (!relevantHours) {
      return DEFAULT_TIME_SLOTS;
    }
    
    const slots: string[] = [];
    const slotDuration = relevantHours.slotDurationMinutes || 60;
    const [openHour, openMinute] = relevantHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = relevantHours.closeTime.split(':').map(Number);
    
    let currentMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    
    while (currentMinutes < closeMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      currentMinutes += slotDuration;
    }
    
    return slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
  }, [apiOperatingHours, selectedDayOfWeek, selectedFacilityDbId, selectedVenueDbId]);

  // Fetch facility add-ons from API for selected facility
  const { data: apiAddOns = [] } = useQuery<FacilityAddOnData[]>({
    queryKey: ['/api/facilities', selectedFacility.id, 'addons'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/facilities/${selectedFacility.id}/addons`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedFacility.id,
  });

  // Icon mapping for add-ons
  const ADD_ON_ICON_MAP: Record<string, typeof Target> = {
    'Target': Target,
    'CircleDot': CircleDot,
    'Droplets': Droplets,
    'ShieldCheck': ShieldCheck,
    'Headphones': Headphones,
    'Glasses': Glasses,
    'Coffee': Coffee,
    'Speaker': Speaker,
  };

  // Transform API add-ons to component format, falling back to hardcoded if API is empty
  const currentFacilityAddOns = useMemo(() => {
    if (apiAddOns.length > 0) {
      return apiAddOns.map(a => ({
        id: a.id,
        label: a.label,
        price: a.price,
        icon: a.icon ? (ADD_ON_ICON_MAP[a.icon] || Target) : Target,
        image: a.imageUrl || mineralWaterImg,
      }));
    }
    // Fallback to hardcoded add-ons if API returns empty
    return FACILITY_ADD_ONS[selectedFacility.id] || [];
  }, [apiAddOns, selectedFacility.id]);

  // Create a map from facility ID to slug
  const facilityIdToSlug = useMemo(() => {
    const map: Record<string, string> = {};
    apiFacilities.forEach(f => {
      map[f.id] = f.slug;
    });
    return map;
  }, [apiFacilities]);

  // Transform API facilities to the format used by the component
  const FACILITIES = useMemo(() => {
    if (apiFacilities.length === 0) {
      return DEFAULT_FACILITIES;
    }
    
    return apiFacilities
      .filter(f => f.status === 'ACTIVE')
      .map(f => ({
        id: f.slug,
        label: f.name,
        count: f.resourceCount || 1,
        basePrice: f.basePrice,
        minPlayers: f.minPlayers || 1,
        icon: FACILITY_ICONS[f.slug] || Building2,
        requiresCert: f.requiresCertification || false,
        restricted: f.isRestricted || false,
      }))
      .sort((a, b) => {
        // Sort by the order in DEFAULT_FACILITIES
        const orderA = DEFAULT_FACILITIES.findIndex(df => df.id === a.id);
        const orderB = DEFAULT_FACILITIES.findIndex(df => df.id === b.id);
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
      });
  }, [apiFacilities]);

  // Update selected facility when FACILITIES changes
  useEffect(() => {
    if (FACILITIES.length > 0 && !FACILITIES.find(f => f.id === selectedFacility.id)) {
      setSelectedFacility(FACILITIES[0]);
    } else if (FACILITIES.length > 0) {
      // Update selected facility data if it changed in the API
      const updatedFacility = FACILITIES.find(f => f.id === selectedFacility.id);
      if (updatedFacility && (
        updatedFacility.count !== selectedFacility.count ||
        updatedFacility.basePrice !== selectedFacility.basePrice
      )) {
        setSelectedFacility(updatedFacility);
      }
    }
  }, [FACILITIES, selectedFacility.id]);

  // Update selected venue when VENUES changes - sync with database
  useEffect(() => {
    if (VENUES.length > 0 && !VENUES.includes(selectedVenue)) {
      // Selected venue not in loaded list, switch to first available
      setSelectedVenue(VENUES[0]);
    }
  }, [VENUES, selectedVenue]);
  
  const { data: apiEvents = [] } = useQuery<EventData[]>({
    queryKey: ['/api/events'],
  });

  // Event registration mutation
  const eventRegisterMutation = useMutation({
    mutationFn: async (data: { eventId: string; fullName: string; email: string; phone?: string }) => {
      return await apiRequest('POST', `/api/events/${data.eventId}/register`, data);
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted!",
        description: "Your registration is pending approval. You'll receive a confirmation email once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register for this event.",
        variant: "destructive",
      });
    },
  });

  const handleEventRegister = (event: { id: string; title: string }) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for events.",
        variant: "destructive",
      });
      window.location.href = '/api/login';
      return;
    }

    eventRegisterMutation.mutate({
      eventId: event.id,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member',
      email: user.email || '',
    });
  };

  // Check if venue is coming soon (not Islamabad)
  const isVenueComingSoon = selectedVenue !== 'Islamabad';

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: (_, variables) => {
      const isBankTransfer = variables.paymentMethod === 'bank_transfer';
      const isCash = variables.paymentMethod === 'cash';
      
      if (isBankTransfer) {
        toast({
          title: "Booking Created!",
          description: "Please complete your bank transfer and share the receipt with us for verification.",
        });
      } else if (isCash) {
        toast({
          title: "Booking Created!",
          description: "Please pay at the facility on your booking date. Your booking will be confirmed upon payment.",
        });
      } else {
        toast({
          title: "Booking Created!",
          description: "Your booking has been successfully created.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setSelectedStartTime(null);
      setSelectedAddOns(new Set());
      setCoachBooked(false);
      setIsMatchmaking(false);
      setCurrentGroupSize(1);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSlotTaken = (time: string) => {
    return existingBookings.some(
      (b) =>
        b.date === selectedDate &&
        b.resourceId === selectedResourceId &&
        b.startTime === time &&
        b.status !== 'CANCELLED'
    );
  };

  const handleMembershipNumberChange = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    setPayerMembershipNumber(trimmed);
    if (!trimmed) {
      setPayerMembershipValid(null);
    } else {
      setPayerMembershipValid(MOCK_MEMBERSHIP_NUMBERS.includes(trimmed));
    }
  };

  const bookingSummary = useMemo(() => {
    if (!selectedStartTime) return null;
    const fac = selectedFacility;
    const perMinutePrice = fac.basePrice / 60;
    let base = perMinutePrice * selectedDuration;
    
    // Apply membership-based discounts (OFF-PEAK HOURS ONLY)
    // Founding: 25% off-peak only
    // Gold: 20% off-peak only  
    // Silver: 10% off-peak only
    // Guest: 0% (no discount)
    let discount = 0;
    const tier = userProfile.membershipTier;
    const offPeak = isOffPeak(selectedStartTime);
    
    // All discounts only apply during off-peak hours (10 AM - 5 PM)
    if (offPeak) {
      if (tier === 'Founding') {
        discount = base * 0.25;
      } else if (tier === 'Gold') {
        discount = base * 0.20;
      } else if (tier === 'Silver') {
        discount = base * 0.10;
      }
    }
    // Guest tier and peak hours get no discount
    
    let addOnTotal = 0;
    selectedAddOns.forEach((id) => {
      const item = currentFacilityAddOns.find((a) => a.id === id);
      if (item) {
        const qty = addOnQuantities[id] ?? 1;
        addOnTotal += item.price * qty;
      }
    });
    if (coachBooked) addOnTotal += 4000;
    return {
      basePrice: Math.round(base),
      discount: Math.round(discount),
      discountLabel: offPeak ? (tier === 'Founding' ? '25% Founding (Off-Peak)' : tier === 'Gold' ? '20% Gold (Off-Peak)' : tier === 'Silver' ? '10% Silver (Off-Peak)' : null) : null,
      addOnTotal,
      totalPrice: Math.round(base - discount + addOnTotal),
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: calculateEndTime(selectedStartTime, selectedDuration),
    };
  }, [selectedStartTime, selectedFacility, selectedDuration, selectedAddOns, addOnQuantities, coachBooked, selectedDate, userProfile.membershipTier, currentFacilityAddOns]);

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

  const changeAddOnQuantity = (id: string, delta: number) => {
    setAddOnQuantities((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.min(10, Math.max(1, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const confirmBooking = async () => {
    if (!bookingSummary || !selectedStartTime) return;
    if (selectedFacility.id === 'multipurpose-hall' && !selectedHallActivity) {
      toast({
        title: "Activity Required",
        description: "Please select a purpose for the Multipurpose Hall booking.",
        variant: "destructive",
      });
      return;
    }

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
      hallActivity: selectedHallActivity,
      addOns: Array.from(selectedAddOns).map((id) => ({
        id,
        quantity: addOnQuantities[id] ?? 1,
      })),
    });
  };

  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'Academy':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
      case 'Tournament':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
      case 'Social':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'Class':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const leaderboardFacilities = FACILITIES.filter((f) => f.id !== 'bridge-room' && f.id !== 'multipurpose-hall');
  const currentLeaderboard = LEADERBOARD_DATA[currentLeaderboardType] || [];

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col md:flex-row border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden min-h-[700px] bg-white dark:bg-slate-800">
      {/* Sidebar */}
      <aside className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700 w-full md:w-72 flex-shrink-0 p-6 flex flex-col justify-between shadow-sm">
        <div>
          <Link href="/">
            <div className="cursor-pointer" data-testid="link-sidebar-logo">
              <h1 className="text-2xl font-extrabold text-[#2a4060] dark:text-sky-400 mb-1 tracking-tight">
                THE QUARTERDECK
              </h1>
              <p className="text-[11px] text-muted-foreground mb-6 uppercase tracking-[0.18em]">
                Central Booking Console
              </p>
            </div>
          </Link>
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('booking')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${
                currentView === 'booking'
                  ? 'bg-[#2a4060] text-white shadow-md'
                  : 'text-muted-foreground hover:bg-sky-50 dark:hover:bg-slate-700'
              }`}
              data-testid="button-nav-booking"
            >
              <CalendarDays className="w-4 h-4" /> Book Facility
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setCurrentView('events')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${
                    currentView === 'events'
                      ? 'bg-[#2a4060] text-white shadow-md'
                      : 'text-muted-foreground hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                  data-testid="button-nav-events"
                >
                  <Trophy className="w-4 h-4" /> Events & Academies
                </button>
                <button
                  onClick={() => setCurrentView('leaderboard')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${
                    currentView === 'leaderboard'
                      ? 'bg-[#2a4060] text-white shadow-md'
                      : 'text-muted-foreground hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                  data-testid="button-nav-leaderboard"
                >
                  <Trophy className="w-4 h-4" /> Leaderboard
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${
                    currentView === 'profile'
                      ? 'bg-[#2a4060] text-white shadow-md'
                      : 'text-muted-foreground hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                  data-testid="button-nav-profile"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
              </>
            )}
          </nav>
        </div>
        
        {/* User Stats - Only show for authenticated users */}
        {isAuthenticated && (
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Credit Balance</p>
                <p className="text-lg font-bold">{formatPKR(userProfile.creditBalance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-5 h-5 text-sky-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Hours Played</p>
                <p className="text-lg font-bold">{userProfile.totalHoursPlayed} hrs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Guest Passes</p>
                <p className="text-lg font-bold">{userProfile.guestPasses}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8 relative overflow-auto bg-gray-50 dark:bg-slate-900">
        {/* BOOKING VIEW */}
        {currentView === 'booking' && !isAuthenticated && (
          <div className="max-w-md mx-auto mt-16 animate-qd-fade-in">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2" data-testid="text-auth-required">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please log in to access the booking system and make reservations.
              </p>
              <div className="space-y-3">
                <a href="/api/login" className="block">
                  <Button className="w-full" data-testid="button-login-booking">
                    Sign In to Continue
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBackToHome}
                  data-testid="button-back-home-auth"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'booking' && isAuthenticated && (
          <div className="max-w-6xl mx-auto space-y-8 animate-qd-fade-in">
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToHome}
                  className="rounded-full"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div>
                  <h2 className="text-2xl font-extrabold" data-testid="text-booking-title">Central Booking</h2>
                  <p className="text-sm text-muted-foreground">Choose your venue, facility, time and extras.</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-0">
                <div className="max-w-xs sm:text-right">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Venue</label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => {
                      setSelectedVenue(e.target.value);
                      setSelectedFacility(FACILITIES[0]);
                      setSelectedResourceId(1);
                      setSelectedStartTime(null);
                      setSelectedAddOns(new Set());
                      setAddOnQuantities({});
                      setCoachBooked(false);
                      setIsMatchmaking(false);
                      setCurrentGroupSize(1);
                      setSelectedHallActivity(null);
                    }}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    data-testid="select-venue"
                  >
                    {VENUES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">Booking preview for: {selectedVenue}</p>
                </div>
              </div>
            </section>

            {/* Coming Soon Overlay for non-Islamabad venues */}
            {isVenueComingSoon && (
              <section className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-center shadow-lg border border-slate-300 dark:border-slate-700">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-sky-500/10 rounded-2xl" />
                <div className="relative z-10">
                  <MapPin className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Coming Soon to {selectedVenue}</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    We're expanding! The Quarterdeck {selectedVenue} is currently under development. 
                    Stay tuned for updates on our upcoming locations.
                  </p>
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    Expected 2026-2027
                  </Badge>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedVenue('Islamabad')}
                      data-testid="button-switch-to-islamabad"
                    >
                      Switch to Islamabad (Available Now)
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Facility Selector - Only show for Islamabad */}
            {!isVenueComingSoon && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">1. Select Facility</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {FACILITIES.map((fac) => {
                  const FacIcon = fac.icon;
                  const isSelected = selectedFacility.id === fac.id;
                  const restricted = fac.restricted && userProfile.membershipTier !== 'Founding';
                  return (
                    <button
                      key={fac.id}
                      onClick={() => {
                        if (!restricted) {
                          setSelectedFacility(fac);
                          setSelectedResourceId(1);
                          setSelectedStartTime(null);
                          setIsMatchmaking(false);
                          setSelectedHallActivity(null);
                        } else {
                          toast({
                            title: "Restricted Area",
                            description: "Exclusive to Founding Members and Armed Forces.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className={`p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center transition-all relative overflow-hidden cursor-pointer ${
                        restricted
                          ? 'opacity-60 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                          : isSelected
                          ? 'ring-4 ring-amber-300 bg-white dark:bg-slate-800 border-amber-500'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-sky-500'
                      }`}
                      data-testid={`button-facility-${fac.id}`}
                    >
                      <FacIcon className="w-8 h-8 mb-1 text-[#2a4060] dark:text-sky-400" />
                      <p className="font-semibold text-sm">{fac.label}</p>
                      <p className="text-[10px] text-muted-foreground">{fac.count} available</p>
                      {restricted && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                          RESTRICTED
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
            )}

            {/* Booking Console Grid - Only show for Islamabad */}
            {!isVenueComingSoon && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Time & Resources Column */}
              <div className="md:col-span-2 space-y-6">
                {/* Resource Selector */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-bold text-muted-foreground border-b pb-2 text-sm border-gray-100 dark:border-slate-700">
                    2. Select Resource ({selectedFacility.label})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: selectedFacility.count }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedResourceId(i + 1)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedResourceId === i + 1
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                        data-testid={`button-resource-${i + 1}`}
                      >
                        Court {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  {/* Hall Activity Type - RESTORED */}
                  {selectedFacility.id === 'multipurpose-hall' && (
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Purpose of Multipurpose Event
                      </label>
                      <select
                        value={selectedHallActivity || ''}
                        onChange={(e) => setSelectedHallActivity(e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                        data-testid="select-hall-activity"
                      >
                        <option value="">-- Select Activity --</option>
                        {HALL_ACTIVITIES.map((activity) => (
                          <option key={activity.value} value={activity.value}>
                            {activity.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Matchmaking Toggle */}
                  {selectedFacility.id !== 'hall' && !selectedFacility.restricted && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
                      <label className="text-sm font-medium">Enable Matchmaking (Join a game)</label>
                      <button
                        onClick={() => setIsMatchmaking(!isMatchmaking)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isMatchmaking ? 'bg-sky-600' : 'bg-gray-300 dark:bg-slate-600'
                        }`}
                        data-testid="switch-matchmaking"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          isMatchmaking ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  )}
                  
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

                  {/* Coach Toggle */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
                    <label className="text-sm font-medium">Book a coach?</label>
                    <button
                      onClick={() => setCoachBooked(!coachBooked)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        coachBooked ? 'bg-sky-600' : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                      data-testid="switch-coach"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        coachBooked ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {coachBooked && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold text-right">+4,000 PKR</p>
                  )}
                </div>

                {/* Time Slot Picker */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">
                    <h4 className="font-bold text-muted-foreground text-sm">3. Select Time Slot</h4>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedStartTime(null);
                        }}
                        className="p-1 border rounded-lg text-xs bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                        data-testid="input-date"
                      />
                    </div>
                  </div>
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
                            : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                        data-testid={`button-duration-${duration}`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const taken = isSlotTaken(time);
                      const isSelected = selectedStartTime === time;
                      const offPeak = isOffPeak(time);

                      return (
                        <button
                          key={time}
                          onClick={() => !taken && setSelectedStartTime(time)}
                          disabled={taken}
                          className={`py-2 px-1 rounded border text-sm font-medium transition relative overflow-hidden ${
                            taken
                              ? 'bg-gray-200 dark:bg-slate-600 text-muted-foreground cursor-not-allowed opacity-70'
                              : isSelected
                              ? 'bg-green-500 text-white shadow-lg border-green-500'
                              : 'bg-white dark:bg-slate-700 text-foreground hover:bg-sky-50 dark:hover:bg-slate-600 border-gray-200 dark:border-slate-600'
                          }`}
                          data-testid={`button-time-${time.replace(':', '')}`}
                        >
                          {time}
                          {offPeak && !taken && !isSelected && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-bl-md" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-1" />
                    Green dot = Off-peak hours (10 AM - 5 PM) - All member tiers get discounts
                  </p>
                </div>
              </div>

              {/* Summary & Payment Column */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-sky-500">
                  <h3 className="font-bold text-lg mb-4">4. Extras & Payment</h3>
                  
                  {bookingSummary ? (
                    <>
                      {/* Add-ons */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Add-ons</h4>
                        <div className="space-y-2">
                          {currentFacilityAddOns.map((item) => {
                            const selected = selectedAddOns.has(item.id);
                            const qty = addOnQuantities[item.id] ?? 1;
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleAddOn(item)}
                                className={`border rounded-xl px-3 py-2 flex items-center gap-3 text-sm transition cursor-pointer hover:shadow-sm ${
                                  selected
                                    ? 'bg-sky-50 dark:bg-sky-900/30 border-amber-500 text-amber-800 dark:text-amber-300'
                                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                                }`}
                                data-testid={`addon-${item.id}`}
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-600">
                                  <img 
                                    src={item.image} 
                                    alt={item.label}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className="font-semibold truncate">{item.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{formatPKR(item.price)} per unit</p>
                                </div>
                                {selected && (
                                  <div className="flex items-center gap-1 text-xs flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => changeAddOnQuantity(item.id, -1)}
                                      className="h-6 w-6 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center font-semibold">{qty}</span>
                                    <button
                                      onClick={() => changeAddOnQuantity(item.id, 1)}
                                      className="h-6 w-6 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payer Details */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Payer Details</h4>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-4 text-xs">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="payer-type"
                                checked={payerType === 'self'}
                                onChange={() => setPayerType('self')}
                                className="accent-sky-600"
                              />
                              <span>Self (use my account)</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="payer-type"
                                checked={payerType === 'member'}
                                onChange={() => setPayerType('member')}
                                className="accent-sky-600"
                              />
                              <span>Another member will pay</span>
                            </label>
                          </div>
                          {payerType === 'member' && (
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold">Membership number of the payer</label>
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
                                  <Check className="w-3 h-3" /> Membership found.
                                </p>
                              )}
                              {payerMembershipValid === false && (
                                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Membership not found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 border-t pt-4 border-gray-100 dark:border-slate-700">Summary</h4>
                      <div className="space-y-1 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Rate ({selectedDuration} min)</span>
                          <span>{formatPKR(bookingSummary.basePrice)}</span>
                        </div>
                        {bookingSummary.discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Member Discount ({bookingSummary.discountLabel})</span>
                            <span>- {formatPKR(bookingSummary.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Add-Ons & Coach</span>
                          <span>+ {formatPKR(bookingSummary.addOnTotal)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-dashed pt-3 border-gray-200 dark:border-slate-600">
                        <span className="font-bold text-lg">TOTAL DUE</span>
                        <span className="font-extrabold text-2xl text-sky-700 dark:text-sky-400">
                          {formatPKR(bookingSummary.totalPrice)}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="mt-6">
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Payment Method</label>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium transition border ${
                              paymentMethod === 'cash'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white dark:bg-slate-700 text-foreground border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}
                            data-testid="button-payment-cash"
                          >
                            Pay On-Site
                          </button>
                          <button
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium transition border ${
                              paymentMethod === 'bank_transfer'
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white dark:bg-slate-700 text-foreground border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}
                            data-testid="button-payment-bank"
                          >
                            Bank Transfer
                          </button>
                          <button
                            onClick={() => setPaymentMethod('credits')}
                            className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium transition border ${
                              paymentMethod === 'credits'
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                                : 'bg-white dark:bg-slate-700 text-foreground border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}
                            data-testid="button-payment-credits"
                          >
                            Credits
                          </button>
                        </div>
                      </div>

                      {/* Bank Transfer Instructions */}
                      {paymentMethod === 'bank_transfer' && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                          <h5 className="font-bold text-purple-800 dark:text-purple-300 text-sm mb-2">Bank Transfer Instructions</h5>
                          <div className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
                            <p><span className="font-semibold">Bank:</span> HBL (Habib Bank Limited)</p>
                            <p><span className="font-semibold">Account Title:</span> The Quarterdeck Sports Club</p>
                            <p><span className="font-semibold">Account #:</span> 1234-5678-9012-3456</p>
                            <p><span className="font-semibold">IBAN:</span> PK00HABB1234567890123456</p>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 italic">
                            After payment, please share your receipt with admin for verification. Your booking will be confirmed once payment is verified.
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={confirmBooking}
                        disabled={createBookingMutation.isPending}
                        className="w-full mt-6 py-3 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 shadow-lg"
                        data-testid="button-confirm-booking"
                      >
                        {createBookingMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                      </Button>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground italic text-sm">
                      Please select a time slot to calculate price.
                    </p>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* EVENTS VIEW */}
        {currentView === 'events' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-qd-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="rounded-full"
                data-testid="button-events-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex-1 text-center">
                <h2 className="text-3xl font-extrabold" data-testid="text-events-title">Events & Academy</h2>
                <p className="text-muted-foreground mt-2 text-sm">Classes, tournaments and social events.</p>
              </div>
              <div className="w-16" /> {/* Spacer for balance */}
            </div>
            {apiEvents.length > 0 ? (
              FACILITIES.map((fac) => {
                const FacIcon = fac.icon;
                const facEvents = apiEvents.filter((e) => facilityIdToSlug[e.facilityId] === fac.id);
                if (facEvents.length === 0) return null;
                return (
                  <section
                    key={fac.id}
                    className={`mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md border-t-4 ${
                      fac.id === 'padel-tennis' ? 'border-sky-500' :
                      fac.id === 'air-rifle-range' ? 'border-red-400' :
                      fac.id === 'squash' ? 'border-slate-400' :
                      fac.id === 'bridge-room' ? 'border-blue-500' : 'border-purple-400'
                    }`}
                    data-testid={`section-events-${fac.id}`}
                  >
                    <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-slate-700 pb-3">
                      <FacIcon className="w-8 h-8 text-[#2a4060] dark:text-sky-400" />
                      <h3 className="text-xl font-extrabold">{fac.label} Programs</h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {facEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-gray-50 dark:bg-slate-700 p-5 rounded-xl border border-gray-100 dark:border-slate-600 flex flex-col justify-between"
                          data-testid={`card-event-${event.id}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`${getEventTypeClass(event.type)} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                                {event.type}
                              </span>
                              <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">{formatPKR(event.price)}</span>
                            </div>
                            <h4 className="font-bold text-lg mb-1">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{event.scheduleDay} at {event.scheduleTime || 'TBA'}</p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            {event.instructor && (
                              <p className="text-xs text-muted-foreground mt-2">Instructor: {event.instructor}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.enrolledCount || 0} / {event.capacity} enrolled
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4" 
                            onClick={() => handleEventRegister(event)}
                            disabled={eventRegisterMutation.isPending || (event.enrolledCount || 0) >= event.capacity}
                            data-testid={`button-register-${event.id}`}
                          >
                            {eventRegisterMutation.isPending ? 'Registering...' : 
                             (event.enrolledCount || 0) >= event.capacity ? 'Full' : 'Register'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Available</h3>
                <p className="text-muted-foreground">Check back soon for upcoming events and academies.</p>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD VIEW */}
        {currentView === 'leaderboard' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-qd-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="rounded-full"
                data-testid="button-leaderboard-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex-1 text-center">
                <h2 className="text-3xl font-extrabold" data-testid="text-leaderboard-title">
                  {currentLeaderboardType === 'cumulative' ? 'Global Arena Leaderboard' : `${FACILITIES.find(f => f.id === currentLeaderboardType)?.label || ''} Top Scorers`}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">Top performers across all facilities.</p>
              </div>
              <div className="w-16" /> {/* Spacer for balance */}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setCurrentLeaderboardType('cumulative')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  currentLeaderboardType === 'cumulative'
                    ? 'bg-[#2a4060] text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
                data-testid="button-leaderboard-cumulative"
              >
                All Facilities
              </button>
              {leaderboardFacilities.map((fac) => {
                const FacIcon = fac.icon;
                return (
                  <button
                    key={fac.id}
                    onClick={() => setCurrentLeaderboardType(fac.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                      currentLeaderboardType === fac.id
                        ? 'bg-[#2a4060] text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                    data-testid={`button-leaderboard-${fac.id}`}
                  >
                    <FacIcon className="w-4 h-4" />
                    {fac.label}
                  </button>
                );
              })}
            </div>

            {/* Leaderboard List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
              {currentLeaderboard.length > 0 ? (
                currentLeaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 ${
                      idx === 0 ? 'bg-amber-50 dark:bg-amber-900/20' :
                      idx === 1 ? 'bg-gray-50 dark:bg-slate-700/50' :
                      idx === 2 ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                    }`}
                    data-testid={`leaderboard-entry-${idx}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        idx === 0 ? 'bg-amber-400 text-white' :
                        idx === 1 ? 'bg-gray-400 text-white' :
                        idx === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-200 dark:bg-slate-600 text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold">{entry.name}</p>
                        <Badge variant="outline" className="text-xs">{entry.tier}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xl text-sky-700 dark:text-sky-400">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No leaderboard data available for this facility.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {currentView === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-qd-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="rounded-full"
                data-testid="button-profile-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex-1 text-center">
                <h2 className="text-3xl font-extrabold" data-testid="text-profile-title">My Profile</h2>
                <p className="text-muted-foreground mt-2 text-sm">Your membership details and stats.</p>
              </div>
              <div className="w-16" /> {/* Spacer for balance */}
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
                <div className="w-20 h-20 rounded-full bg-[#2a4060] flex items-center justify-center text-white text-3xl font-bold">
                  {isAuthenticated && user ? (user.firstName?.charAt(0) || 'M') : 'M'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{isAuthenticated && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member' : 'Guest User'}</h3>
                  <p className="text-muted-foreground">{isAuthenticated && user ? user.email : 'Not logged in'}</p>
                  <Badge className="mt-2 bg-amber-500 text-white">{userProfile.membershipTier} Member</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-6 h-6 text-amber-500" />
                    <span className="text-sm font-semibold text-muted-foreground">Credit Balance</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPKR(userProfile.creditBalance)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Timer className="w-6 h-6 text-sky-500" />
                    <span className="text-sm font-semibold text-muted-foreground">Hours Played</span>
                  </div>
                  <p className="text-2xl font-bold">{userProfile.totalHoursPlayed} hours</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Ticket className="w-6 h-6 text-emerald-500" />
                    <span className="text-sm font-semibold text-muted-foreground">Guest Passes</span>
                  </div>
                  <p className="text-2xl font-bold">{userProfile.guestPasses} remaining</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <span className="text-sm font-semibold text-muted-foreground">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.isSafetyCertified && (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                        <Check className="w-3 h-3 mr-1" /> Air Rifle Certified
                      </Badge>
                    )}
                    {userProfile.hasSignedWaiver && (
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 dark:text-blue-400">
                        <FileCheck className="w-3 h-3 mr-1" /> Waiver Signed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="mt-8 p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                  <p className="text-sm text-center mb-4">Sign in to access your full profile and booking history.</p>
                  <div className="flex justify-center">
                    <Link href="/api/login">
                      <Button data-testid="button-sign-in">Sign In</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
