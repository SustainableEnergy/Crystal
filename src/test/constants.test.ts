import { describe, it, expect } from 'vitest';
import { BOND_DISTANCE } from '../../core/constants/geometry';

describe('Geometry Constants', () => {
    it('should have correct bond distances', () => {
        expect(BOND_DISTANCE.METAL_OXYGEN).toBe(2.4);
        expect(BOND_DISTANCE.PHOSPHORUS_OXYGEN).toBe(1.9);
        expect(BOND_DISTANCE.MIN_DISTANCE).toBe(0.1);
    });

    it('should have bond distances in correct order', () => {
        expect(BOND_DISTANCE.METAL_OXYGEN).toBeGreaterThan(BOND_DISTANCE.PHOSPHORUS_OXYGEN);
        expect(BOND_DISTANCE.PHOSPHORUS_OXYGEN).toBeGreaterThan(BOND_DISTANCE.MIN_DISTANCE);
    });
});
