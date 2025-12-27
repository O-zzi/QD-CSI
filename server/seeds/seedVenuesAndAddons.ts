import { db } from '../db';
import { venues, facilityAddOns, facilities, facilityVenues } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedVenuesAndAddons() {
  console.log('Seeding venues and facility addons...');

  try {
    const existingVenues = await db.select().from(venues);
    if (existingVenues.length === 0) {
      const venueData = [
        {
          id: crypto.randomUUID(),
          name: 'The Quarterdeck Islamabad',
          slug: 'islamabad',
          city: 'Islamabad',
          country: 'Pakistan',
          status: 'ACTIVE' as const,
          isDefault: true,
        },
      ];

      await db.insert(venues).values(venueData);
      console.log(`Seeded ${venueData.length} venues`);
    } else {
      console.log(`Venues already exist (${existingVenues.length} found), skipping`);
    }

    const allVenues = await db.select().from(venues);
    const allFacilities = await db.select().from(facilities);
    
    const existingFacilityVenues = await db.select().from(facilityVenues);
    if (existingFacilityVenues.length === 0 && allVenues.length > 0 && allFacilities.length > 0) {
      const islamabadVenue = allVenues.find(v => v.slug === 'islamabad');
      if (islamabadVenue) {
        const facilityVenueData = allFacilities.map(facility => ({
          id: crypto.randomUUID(),
          facilityId: facility.id,
          venueId: islamabadVenue.id,
          status: facility.status as 'ACTIVE' | 'COMING_SOON' | 'PLANNED',
          resourceCount: facility.resourceCount,
          priceOverride: null,
        }));
        
        await db.insert(facilityVenues).values(facilityVenueData);
        console.log(`Linked ${facilityVenueData.length} facilities to Islamabad venue`);
      }
    } else {
      console.log(`Facility-venue links already exist (${existingFacilityVenues.length} found), skipping`);
    }

    const existingAddons = await db.select().from(facilityAddOns);
    if (existingAddons.length === 0) {
      const padelFacility = allFacilities.find(f => f.slug === 'padel-tennis');
      const squashFacility = allFacilities.find(f => f.slug === 'squash');
      const airRifleFacility = allFacilities.find(f => f.slug === 'air-rifle-range');
      const multipurposeFacility = allFacilities.find(f => f.slug === 'multipurpose-hall');

      const addonsData = [];

      if (padelFacility) {
        addonsData.push(
          {
            id: crypto.randomUUID(),
            facilityId: padelFacility.id,
            label: 'Padel Racket Rental',
            price: 500,
            icon: 'racket',
          },
          {
            id: crypto.randomUUID(),
            facilityId: padelFacility.id,
            label: 'Ball Pack (3 balls)',
            price: 300,
            icon: 'circle',
          },
          {
            id: crypto.randomUUID(),
            facilityId: padelFacility.id,
            label: 'Professional Coaching (1 hour)',
            price: 3000,
            icon: 'user',
          },
          {
            id: crypto.randomUUID(),
            facilityId: padelFacility.id,
            label: 'Video Analysis Session',
            price: 2000,
            icon: 'video',
          },
        );
      }

      if (squashFacility) {
        addonsData.push(
          {
            id: crypto.randomUUID(),
            facilityId: squashFacility.id,
            label: 'Squash Racket Rental',
            price: 400,
            icon: 'racket',
          },
          {
            id: crypto.randomUUID(),
            facilityId: squashFacility.id,
            label: 'Squash Balls (Pack of 2)',
            price: 200,
            icon: 'circle',
          },
          {
            id: crypto.randomUUID(),
            facilityId: squashFacility.id,
            label: 'Squash Coaching (1 hour)',
            price: 2500,
            icon: 'user',
          },
        );
      }

      if (airRifleFacility) {
        addonsData.push(
          {
            id: crypto.randomUUID(),
            facilityId: airRifleFacility.id,
            label: 'Extra Pellets (100 rounds)',
            price: 500,
            icon: 'target',
          },
          {
            id: crypto.randomUUID(),
            facilityId: airRifleFacility.id,
            label: 'Safety Equipment Set',
            price: 300,
            icon: 'shield',
          },
          {
            id: crypto.randomUUID(),
            facilityId: airRifleFacility.id,
            label: 'Professional Instruction (1 hour)',
            price: 2000,
            icon: 'user',
          },
        );
      }

      if (multipurposeFacility) {
        addonsData.push(
          {
            id: crypto.randomUUID(),
            facilityId: multipurposeFacility.id,
            label: 'Sound System',
            price: 5000,
            icon: 'speaker',
          },
          {
            id: crypto.randomUUID(),
            facilityId: multipurposeFacility.id,
            label: 'Projector & Screen',
            price: 3000,
            icon: 'monitor',
          },
          {
            id: crypto.randomUUID(),
            facilityId: multipurposeFacility.id,
            label: 'Catering Service (per person)',
            price: 500,
            icon: 'utensils',
          },
          {
            id: crypto.randomUUID(),
            facilityId: multipurposeFacility.id,
            label: 'Full Meal Service (per person)',
            price: 1500,
            icon: 'utensils',
          },
        );
      }

      if (addonsData.length > 0) {
        await db.insert(facilityAddOns).values(addonsData);
        console.log(`Seeded ${addonsData.length} facility addons`);
      }
    } else {
      console.log(`Facility addons already exist (${existingAddons.length} found), skipping`);
    }

    console.log('Venues and addons seeding complete!');
  } catch (error) {
    console.error('Error seeding venues and addons:', error);
    throw error;
  }
}
