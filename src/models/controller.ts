import * as THREE from 'three';
import Player from './player';

let instance: Controller | null = null;

export const GRAVITY = 9.8;

export default class Controller {
    isForwards?: boolean;
    isBackwards?: boolean;
    isRight?: boolean;
    isLeft?: boolean;
    velocity?: number;
    isJump?: boolean;
    isJumpLoad?: boolean;
    jumpHightMax?: number;
    meshFloorTouchY?: number;
    height?: number;

    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;

        const player = new Player();

        this.height = player.height;
        this.isForwards = false;
        this.isBackwards = false;
        this.isRight = false;
        this.isLeft = false;
        this.isJump = false;
        this.isJumpLoad = false;
        this.jumpHightMax = 5;
        this.velocity = 0.00002;
        this.meshFloorTouchY = this.height! / 2.0 || 1;
        this.initListeners();
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

        if (event.key === ' ' && !this.isJumpLoad) {
            this.isJumpLoad = true;
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

        if (event.key === ' ' && this.isJumpLoad) {
            this.isJumpLoad = false;
            this.isJump = true;
        }
    }

    initListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    updateMesh(
        mesh: THREE.Mesh<
            THREE.SphereGeometry,
            THREE.MeshStandardMaterial,
            THREE.Object3DEventMap
        >,
        deltaTime: number,
    ) {
        let z = mesh.position.z;
        let x = mesh.position.x;
        let y = mesh.position.y;

        let rotationX = mesh.rotation.x;
        let rotationY = mesh.rotation.y;
        let rotationZ = mesh.rotation.z;

        const effectiveVelocity = deltaTime * this.velocity!;

        if (this.isForwards) {
            z -= effectiveVelocity;
            rotationZ -= effectiveVelocity;
        }

        if (this.isBackwards) {
            z += effectiveVelocity;
            rotationZ += effectiveVelocity;
        }

        if (this.isRight) {
            x += effectiveVelocity;
            rotationX += effectiveVelocity;
        }

        if (this.isLeft) {
            x -= effectiveVelocity;
            rotationX -= effectiveVelocity;
        }
        if (this.isJump && y < this.jumpHightMax!) {
            y += effectiveVelocity;
        } else if (this.isJump && y >= this.jumpHightMax!) {
            this.isJump = false;
        } else if (!this.isJump && y > this.meshFloorTouchY!) {
            y -= Math.sqrt(2 * GRAVITY * y) * deltaTime * 0.000005;
        }

        if (y <= this.meshFloorTouchY!) {
            y = this.meshFloorTouchY!;
        }

        mesh.position.set(x, y, z);
        mesh.rotation.set(rotationX, rotationY, rotationZ);
    }
}
