const { FARE, DHAKA_ZONES } = require("../utils/constants");

/**
 * Haversine distance in km between two Dhaka zone centroids.
 * We deliberately do NOT call any real routing/maps API (PRD Section 4) -
 * a straight-line estimate between fixed zone points is enough for an MVP
 * and is fully reproducible/testable by hand.
 */
function distanceBetweenZones(zoneA, zoneB) {
  const a = DHAKA_ZONES[zoneA];
  const b = DHAKA_ZONES[zoneB];
  if (!a || !b) throw new Error(`Unknown zone: ${zoneA} or ${zoneB}`);
  if (zoneA === zoneB) return 1.5; // minimum intra-zone hop, avoids a 0 km fare

  const R = 6371; // Earth radius km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 100) / 100; // round to 2 decimal places
}

/**
 * passengerFare = baseFare + distanceCharge - poolDiscount
 * All amounts in integer poysha. isPooled = true when >=2 passengers
 * share the same Ride, which triggers the pool discount.
 *
 * Worked example (Nusrat, Banani -> Mohakhali, pooled with Rafiq):
 *   distanceKm ~= 1.66km (straight-line Banani->Mohakhali)
 *   base = 3000
 *   distanceCharge = round(1.66 * 1500) = 2490
 *   subtotal = 5490
 *   poolDiscount (20%) = 1098
 *   total = 4392 poysha = 43.92 Taka
 */
function calculateFare({ distanceKm, isPooled }) {
  const baseFarePoysha = FARE.BASE_FARE_POYSHA;
  const distanceChargePoysha = Math.round(distanceKm * FARE.PER_KM_RATE_POYSHA);
  const subtotal = baseFarePoysha + distanceChargePoysha;
  const poolDiscountPoysha = isPooled
    ? Math.round((subtotal * FARE.POOL_DISCOUNT_PERCENT) / 100)
    : 0;
  const totalFarePoysha = subtotal - poolDiscountPoysha;

  return {
    baseFarePoysha,
    distanceChargePoysha,
    poolDiscountPoysha,
    totalFarePoysha,
  };
}

module.exports = { distanceBetweenZones, calculateFare };
