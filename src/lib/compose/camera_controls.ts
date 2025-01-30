import CC from 'camera-controls';
import {
	Box3,
	Matrix4,
	Quaternion,
	Raycaster,
	Sphere,
	Spherical,
	Vector2,
	Vector3,
	Vector4
} from 'three';
import type { Camera } from '../types/camera';

export default class CameraControls extends CC {
	static #installed = false;
	constructor(element: HTMLElement, camera: Camera) {
		if (!CameraControls.#installed) {
			CC.install({
				THREE: {
					Box3,
					Matrix4,
					Quaternion,
					Raycaster,
					Sphere,
					Spherical,
					Vector2,
					Vector3,
					Vector4
				}
			});
			CameraControls.#installed = true;
		}

		super(camera, element);
	}
}
