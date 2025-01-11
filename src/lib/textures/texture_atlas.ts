import { Texture, Vector4 } from 'three';

class TextureAtlasError extends Error {}

export class TextureAtlas {
	private animations: Map<string, Texture> = new Map();
	private textures: Map<string, Vector4> = new Map();
	private canvas: OffscreenCanvas = new OffscreenCanvas(1024, 1024);
	private context: OffscreenCanvasRenderingContext2D = this.canvas.getContext('2d')!;
	private dx = 0;
	private dy = 0;
	texture: Texture = new Texture(this.canvas);

	set(key: string, img: HTMLImageElement) {
		if (img.height > img.width) {
			throw new TextureAtlasError('Animations cannot be put on atlas.');
		}
		if (this.textures.has(key)) {
			return this.textures.get(key);
		}
		if (this.canvas.width == this.dx) {
			this.dx = 0;
			this.dy += img.height;
			if (this.dy == this.canvas.height) {
				this.canvas.height += img.height;
			}
		} else {
			this.dx += img.width;
		}
		this.context.drawImage(img, this.dx, this.dy, img.width, img.height);
	}

	get(key: string) {
		return this.textures.get(key);
	}

	setAnimation(key: string, img: HTMLImageElement) {
		this.animations.set(key, new Texture(img));
	}

	getAnimation(key: string) {
		this.animations.get(key);
	}
}
