<script module lang="ts">
	let installed = false;
</script>

<script lang="ts">
	import { T, useTask, useParent, useThrelte, type Props } from '@threlte/core';

	import CameraControls from 'camera-controls';
	import {
		Box3,
		Matrix4,
		OrthographicCamera,
		Quaternion,
		Raycaster,
		Sphere,
		Spherical,
		Vector2,
		Vector3,
		Vector4,
		type PerspectiveCamera
	} from 'three';

	const subsetOfTHREE = {
		Vector2,
		Vector3,
		Vector4,
		Quaternion,
		Matrix4,
		Spherical,
		Box3,
		Sphere,
		Raycaster
	};

	if (!installed) {
		CameraControls.install({ THREE: subsetOfTHREE });
		installed = true;
	}

	const parent = useParent();

	if (!$parent) {
		throw new Error('CameraControls must be a child of a ThreeJS camera');
	}

	const { renderer, invalidate } = useThrelte();

	const {
		ref = $bindable(
			new CameraControls($parent as PerspectiveCamera | OrthographicCamera, renderer?.domElement)
		),
		...rest
	}: Props<CameraControls> = $props();

	useTask(
		(delta) => {
			const updated = ref.update(delta);
			if (updated) invalidate();
		},
		{
			autoInvalidate: false
		}
	);
</script>

<T is={ref} {...rest}></T>
