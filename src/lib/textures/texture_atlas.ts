import { NearestFilter, RepeatWrapping, Texture } from 'three';
import type { Modification } from '../types/common';

class TextureAtlasError extends Error {}

export class TextureAtlas {
	private _texture: Texture | null = null;
	private images: Map<string, HTMLImageElement> = new Map();
	private animations: Map<string, Texture> = new Map();

	size: number = 0;
	modification: Map<string, Modification> = new Map();

	get texture() {
		return this._texture!;
	}

	create() {
		let maxDx = 0;
		let maxDy = 0;
		let dx = 0;
		let dy = 0;

		const size = Math.ceil(Math.sqrt(this.images.size));
		const values = this.images.entries().reduce(
			(prev, [key, img], i) => {
				const value = [...prev, { img, key, mod: { dx, dy, w: img.width, h: img.height } }];
				dx += img.width;
				if (img.height > maxDy) maxDy = img.height;
				if ((i + 1) % size == 0) {
					dy += maxDy;
					if (dx > maxDx) maxDx = dx;
					dx = 0;
				}
				return value;
			},
			[] as { img: HTMLImageElement; mod: Modification; key: string }[]
		);

		const maxDim = Math.max(maxDx, dy);
		this.size = maxDim;
		const canvas = new OffscreenCanvas(maxDim, maxDim);
		const context = canvas.getContext('2d')!;

		values.forEach(({ img, mod, key }) => {
			context.drawImage(img, mod.dx, mod.dy);
			this.modification.set(key, mod);
		});

		canvas.convertToBlob().then(async (obj) => {
			const debugImage = new Image();
			debugImage.src = URL.createObjectURL(obj);
			await debugImage.decode();
			document.body.appendChild(debugImage);
		});

		this._texture = this.createTexture(canvas);
	}

	set(key: string, img: HTMLImageElement) {
		if (img.height > img.width) {
			throw new TextureAtlasError('Animations cannot be put on atlas.');
		}
		if (!this.images.has(key)) {
			this.images.set(key, img);
		}
	}

	get(key: string) {
		return this.modification.get(key);
	}

	setAnimation(key: string, img: HTMLImageElement) {
		this.animations.set(key, this.createTexture(img));
	}

	getAnimation(key: string) {
		return this.animations.get(key);
	}

	private createTexture(img: TexImageSource | OffscreenCanvas) {
		const texture = new Texture(img);
		texture.minFilter = NearestFilter;
		texture.magFilter = NearestFilter;
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		texture.flipY = false;
		texture.needsUpdate = true;
		return texture;
	}
}
