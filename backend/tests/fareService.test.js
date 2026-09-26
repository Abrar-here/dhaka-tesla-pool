const {
  calculateFare,
  distanceBetweenZones,
} = require("../src/services/fareService");

describe("fareService", () => {
  describe("distanceBetweenZones", () => {
    test("returns a positive distance between two different zones", () => {
      const distance = distanceBetweenZones("BANANI", "MOHAKHALI");
      expect(distance).toBeGreaterThan(0);
    });

    test("is symmetric (A to B equals B to A)", () => {
      const ab = distanceBetweenZones("BANANI", "GULSHAN");
      const ba = distanceBetweenZones("GULSHAN", "BANANI");
      expect(ab).toBe(ba);
    });

    test("returns a minimum distance for the same zone (never 0 km)", () => {
      const distance = distanceBetweenZones("BANANI", "BANANI");
      expect(distance).toBe(1.5);
    });

    test("throws for an unknown zone", () => {
      expect(() => distanceBetweenZones("BANANI", "NOT_A_REAL_ZONE")).toThrow();
    });
  });

  describe("calculateFare", () => {
    test("solo fare has no pool discount", () => {
      const fare = calculateFare({ distanceKm: 1.66, isPooled: false });
      expect(fare.baseFarePoysha).toBe(3000);
      expect(fare.distanceChargePoysha).toBe(2490); // 1.66 * 1500 rounded
      expect(fare.poolDiscountPoysha).toBe(0);
      expect(fare.totalFarePoysha).toBe(5490);
    });

    test("pooled fare applies a 20% discount on the subtotal", () => {
      const fare = calculateFare({ distanceKm: 1.66, isPooled: true });
      expect(fare.baseFarePoysha).toBe(3000);
      expect(fare.distanceChargePoysha).toBe(2490);
      expect(fare.poolDiscountPoysha).toBe(1098); // 20% of 5490
      expect(fare.totalFarePoysha).toBe(4392);
    });

    test("pooled fare is always cheaper than solo fare for the same distance", () => {
      const solo = calculateFare({ distanceKm: 5, isPooled: false });
      const pooled = calculateFare({ distanceKm: 5, isPooled: true });
      expect(pooled.totalFarePoysha).toBeLessThan(solo.totalFarePoysha);
    });

    test("fare scales up with distance", () => {
      const near = calculateFare({ distanceKm: 1, isPooled: false });
      const far = calculateFare({ distanceKm: 10, isPooled: false });
      expect(far.totalFarePoysha).toBeGreaterThan(near.totalFarePoysha);
    });

    test("all fare fields are integers (no floating point poysha)", () => {
      const fare = calculateFare({ distanceKm: 3.333, isPooled: true });
      expect(Number.isInteger(fare.baseFarePoysha)).toBe(true);
      expect(Number.isInteger(fare.distanceChargePoysha)).toBe(true);
      expect(Number.isInteger(fare.poolDiscountPoysha)).toBe(true);
      expect(Number.isInteger(fare.totalFarePoysha)).toBe(true);
    });
  });
});
