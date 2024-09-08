import { BufferAttribute, Vector3 } from 'three';
import { expect, test, describe, it } from 'vitest';

function rotateUVs(uv: number[], angle: number) {
    angle = angle * (Math.PI / 180);

    const res: number[] = [];

    const mid = 0.5;
    // Loop through each UV and apply the rotation
    for (let i = 0; i < uv.length; i+=2) {
        const u = uv[i];
        const v = uv[i + 1];

        const newU = Math.cos(angle) * (u - mid) + Math.sin(angle) * (v - mid) + mid;
        const newV = Math.cos(angle) * (v - mid) - Math.sin(angle) * (u - mid) + mid;

        // Update the UV attribute with the new rotated coordinates
        res.push(...[newU, newV]);
    }
    return res;
}

describe('Compare lines in two large files', () => {
	it('normal to normal', async () => {
		const normal = [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];

		const normalToNormal = rotateUVs(normal, 0);

		expect(normalToNormal).toBe(normal);
	});

	it('normal to 90', async () => {
		const normal = [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];
		const ninety = [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0];

		const normalToNinety = rotateUVs(normal, 90);

		expect(normalToNinety).toBe(ninety);
	});

	it('normal to 180', async () => {
		const normal = [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];
		const heighty = [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0];

		const normalToHEighty = rotateUVs(normal, 180);

		expect(normalToHEighty).toBe(heighty);
	});

    it('normal to 270', async () => {
		const normal = [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];
		const twoSeventy = [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1];

		const normalToTwoSeventy = rotateUVs(normal, 180);

		expect(normalToTwoSeventy).toBe(twoSeventy);
	});

    it('180 is not 270', async () => {
        const normal = [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];

        const normalToHEighty = rotateUVs(normal, 180);
        const normalToTwoSeventy = rotateUVs(normal, 270);

        expect(normalToHEighty).not.toBe(normalToTwoSeventy);
    })
});
