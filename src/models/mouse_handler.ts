import Player from './player';
import * as THREE from 'three';

let instance: MouseHandler | null = null;

export default class MouseHandler {
    player: Player | null;
    mouseVector: THREE.Vector2;
    rayCaster?: THREE.Raycaster;
    mousePosition?: THREE.Vector3;
    lastContactPoint: THREE.Vector3;

    constructor(player: Player) {
        this.player = player;
        this.mouseVector = new THREE.Vector2();
        this.rayCaster = new THREE.Raycaster();
        this.mousePosition = new THREE.Vector3();
        this.lastContactPoint = new THREE.Vector3();

        window.addEventListener('mousedown', this.handleMouseDown.bind(this));

        window.addEventListener('mousemove', this.handleMouseMove.bind(this));

        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    static async init(player: Player) {
        if (instance) {
            return instance;
        }

        const mouseHandler = new MouseHandler(player);

        instance = mouseHandler;

        return instance;
    }

    handleMouseMove(e: MouseEvent) {
        this.getUpdatedMousePoint(e);
        this.player!.handleMouseMove(e);
    }

    handleMouseDown(e: MouseEvent) {
        this.player!.handleMouseDown(e);
    }

    handleMouseUp() {
        this.player!.handleMouseUp();
    }

    getUpdatedMousePoint(e: MouseEvent) {
        this.mouseVector.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1,
        );

        this.rayCaster!.setFromCamera(this.mouseVector!, this.player!.camera!);

        const intersects = this.rayCaster!.intersectObjects(
            this.player!.scene!.children,
            true,
        );

        const point = intersects?.[0]?.point;

        this.lastContactPoint = point;

        if (point) {
            this.mousePosition!.copy(point);
        }
    }
}
