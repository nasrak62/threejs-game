import * as THREE from 'three';
import Player from './player';
import MouseHandler from './mouse_handler';
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as RAPIER from '@dimforge/rapier3d';
import ThirdPersonCamera from './third_person_camera';

let instance: Controller | null = null;

export const GRAVITY = 9.8;

export default class Controller {
    isForwards?: boolean;
    isBackwards?: boolean;
    isRight?: boolean;
    isLeft?: boolean;
    isJump?: boolean;
    isJumpLoad?: boolean;
    height?: number;
    camera?: THREE.PerspectiveCamera;
    scene?: THREE.Scene;
    pointerLocked: boolean;
    renderer?: THREE.WebGLRenderer;
    distance: number;
    rigidBody?: RAPIER.RigidBody;
    followTarget = new THREE.Object3D();
    thirdPersonCamera?: ThirdPersonCamera;
    vector = new THREE.Vector3();
    inputVelocity = new THREE.Vector3();
    euler = new THREE.Euler();
    quaternion = new THREE.Quaternion();
    rotationMatrix = new THREE.Matrix4();
    targetQuaternion = new THREE.Quaternion();

    constructor() {
        this.isForwards = false;
        this.isBackwards = false;
        this.isRight = false;
        this.isLeft = false;
        this.isJump = false;
        this.isJumpLoad = false;
        this.targetQuaternion = new THREE.Quaternion();
        this.distance = 0;
        this.pointerLocked = false;
        this.initListeners();
    }

    static async init(player: Player) {
        if (instance) {
            return instance;
        }

        const controller = new Controller();

        controller.height = player.height;
        controller.camera = player.camera;
        controller.scene = player.scene;
        controller.renderer = player.renderer;
        controller.thirdPersonCamera = player.thirdPersonCamera;
        controller.rigidBody = player.rigidBody;

        controller.scene.add(controller.followTarget);

        instance = controller;

        return controller;
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'w' && !this.isForwards) {
            this.isForwards = true;
        }

        if (event.key === 's' && !this.isBackwards) {
            this.isBackwards = true;
        }

        if (event.key === 'd' && !this.isRight) {
            this.isRight = true;
        }

        if (event.key === 'a' && !this.isLeft) {
            this.isLeft = true;
        }

        if (event.key === ' ' && !this.isJump) {
            this.isJump = true;
        }
    }

    handleKeyUp(event: KeyboardEvent) {
        if (event.key === 'w' && this.isForwards) {
            this.isForwards = false;
        }
        if (event.key === 's' && this.isBackwards) {
            this.isBackwards = false;
        }
        if (event.key === 'd' && this.isRight) {
            this.isRight = false;
        }
        if (event.key === 'a' && this.isLeft) {
            this.isLeft = false;
        }

        if (event.key === ' ') {
            this.isJump = false;
        }
    }

    initListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    updateMesh(mesh: THREE.Group<THREE.Object3DEventMap>, deltaTime: number) {
        if (!mesh || !this.rigidBody || !this.thirdPersonCamera) {
            return;
        }

        // camera.getWorldDirection(dir);


        this.rigidBody.resetForces(true);

        this.inputVelocity.set(0, 0, 0);
        let limit = 1;
        const speed = 1;

        if (this.isForwards) {
            this.inputVelocity.z = speed;
            limit = 9.5;
        }

        if (this.isBackwards) {
            this.inputVelocity.z = -speed;
            limit = 9.5;
        }

        if (this.isLeft) {
            this.inputVelocity.x = speed;
            limit = 9.5;
        }

        if (this.isRight) {
            this.inputVelocity.x = -speed;
            limit = 9.5;
        }

        if (this.isJump) {
            this.inputVelocity.y = 20 * speed;
        }

        this.inputVelocity.setLength(deltaTime * limit * 0.001); // limits horizontal movement

        // this.euler.y = this.thirdPersonCamera!.yaw.rotation.y;
        // this.quaternion.setFromEuler(this.euler);
        // this.inputVelocity.applyQuaternion(this.quaternion);
        this.rigidBody!.applyImpulse(this.inputVelocity, true);

        // // The followCam will lerp towards the followTarget position.
        // const translation = this.rigidBody!.translation();

        // this.followTarget.position.set(
        //     translation.x,
        //     translation.y,
        //     translation.z,
        // ); // Copy the capsules position to followTarget
        // this.followTarget.getWorldPosition(this.vector); // Put followTargets new world position into a vector
        // this.thirdPersonCamera!.pivot.position.lerp(
        //     this.vector,
        //     deltaTime * 10 * 0.000001,
        // ); // lerp the followCam pivot towards the vector

        // // Eve model also lerps towards the capsules position, but independently of the followCam
        // mesh.position.lerp(this.vector, deltaTime * 20);

        // // // Also turn Eve to face the direction of travel.
        // // // First, construct a rotation matrix based on the direction from the followTarget to Eve
        // this.rotationMatrix.lookAt(
        //     this.followTarget.position,
        //     mesh.position as THREE.Vector3,
        //     mesh.up as THREE.Vector3,
        // );
        // this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix); // creating a quaternion to rotate Eve, since eulers can suffer from gimbal lock

        // // Next, get the distance from the Eve model to the followTarget
        // const distance = mesh.position.distanceTo(this.followTarget.position);

        // // If distance is higher than some espilon, and Eves quaternion isn't the same as the targetQuaternion, then rotate towards the targetQuaternion.
        // if (
        //     (distance as number) > 0.0001 &&
        //     !mesh.quaternion.equals(this.targetQuaternion)
        // ) {
        //     this.targetQuaternion.z = 0; // so that it rotates around the Y axis
        //     this.targetQuaternion.x = 0; // so that it rotates around the Y axis
        //     this.targetQuaternion.normalize(); // always normalise quaternions before use.
        //     mesh.quaternion.rotateTowards(
        //         this.targetQuaternion,
        //         deltaTime * 20,
        //     );
        // }
    }
}
