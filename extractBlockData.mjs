import 'zx/globals';
import * as fse from 'fs-extra/esm';
import { usePwsh } from 'zx';

usePwsh();

const blocksArr = await fse.readJson('./blocks.json');

const blocks = {};

blocksArr.forEach(({ name, transparent }) => {
	blocks[name] = { transparent };
});

await fse.writeJson('./src/lib/blocks.json', blocks);
