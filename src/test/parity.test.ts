import { expect, describe, it } from 'vitest';
import readline from 'readline';
import { createReadStream } from 'fs';

async function readLinesFromFile(filePath: string) {
	const fileStream = createReadStream(filePath);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity
	});

	const lines: string[] = [];
	for await (const line of rl) {
		lines.push(line);
	}

	return lines;
}

describe('Compare lines in two large files', () => {
	it('should match all lines in both files', async () => {
		const toTest = await readLinesFromFile('toTest.txt');
		const test = await readLinesFromFile('test.txt');

		expect(toTest.length).toBe(test.length);

		for (let i = 0; i < toTest.length; i++) {
			expect(toTest[i]).toBe(test[i]);
		}
	});
});
