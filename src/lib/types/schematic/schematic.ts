import type { Vector3 } from 'three';
import type { NBTBlockData } from '../../compose/scene.svelte';
import CC from 'camera-controls';

export const enum CameraType {
	Orthographic = 'orthographic',
	Perspective = 'perspective'
}

export type Props = {
	cameraType: CameraType;
	cameraPosition: Vector3;
	frustumSize: number;
	target: Vector3;
	cameraState: {
		cameraPosition: Vector3;
		target: Vector3;
	} | null;
	cameraControls: CC | null;
};
