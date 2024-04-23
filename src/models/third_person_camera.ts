import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import Player from './player';
import { quat, vec } from '../utils/three_rapier';

export default class ThirdPersonCamera {
    camera: THREE.PerspectiveCamera;
    pivot = new THREE.Object3D();
    yaw = new THREE.Object3D();
    pitch = new THREE.Object3D();
    isLocked = false;
    rigidBody: RAPIER.RigidBody;
    mesh: THREE.Group<THREE.Object3DEventMap>;

    constructor(player: Player) {
        this.camera = player.camera!;
        const renderer = player.renderer!;
        this.rigidBody = player.rigidBody!;
        this.mesh = player.mesh!;

        this.yaw.position.y = 0.75;

        document.addEventListener('click', () => {
            if (!this.isLocked) {
                renderer.domElement.requestPointerLock();

                this.isLocked = true;
            }
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === renderer.domElement) {
                renderer.domElement.addEventListener(
                    'mousemove',
                    this.onDocumentMouseMove,
                );
            } else {
                this.isLocked = false;
                renderer.domElement.removeEventListener(
                    'mousemove',
                    this.onDocumentMouseMove,
                );
            }
        });
    }

    onDocumentMouseMove = (e: MouseEvent) => {
        // this.rigidBody.resetTorques(true);
        this.rigidBody.setRotation(new THREE.Quaternion(0, 1, 0), true);
        const quaternion = quat(this.rigidBody.rotation()).normalize();
        const value = vec(this.rigidBody.translation()).applyQuaternion(
            quaternion,
        );
        console.log({ quaternion, value });
        // this.camera.rotation.y += e.movementX * 0.002;
        // this.camera.quaternion.copy(quat(this.rigidBody.rotation()));
        const direction = this.mesh.rotation;
        const target = new THREE.Vector3(direction.x, direction.y, direction.z);
        // this.camera.position.copy(vec(this.rigidBody.translation()));
        // this.camera.position.copy(
        //     value.multiplyScalar(5),
        //     // .add(new THREE.Vector3(-10, 10, value.z * 5 + 20)),
        // );

        this.camera.rotation.copy(new THREE.Euler(0, -1, 0));
        this.camera.position.copy(new THREE.Vector3(-40, 10, 0));
        // this.camera.position.add(new THREE.Vector3(1, 4, 1));
    };
}
