import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';

export const quat = (rotation: RAPIER.Rotation): THREE.Quaternion => {
    return new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
};

export const vec = (vector: RAPIER.Vector3): THREE.Vector3 => {
    return new THREE.Vector3(vector.x, vector.y, vector.z);
};
