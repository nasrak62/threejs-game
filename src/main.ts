import './style.css';
import World from './models/world';
import { initPhysics } from './physics';

let world: World | null = null;
// let RAPIER: any = null;
const startTime = Date.now();

async function start() {
    world = await World.init();

    animate();
}

async function animate() {
    try {
        if (!world || !world.physicsWorld) {
            return;
        }

        const elapsedTime = world.clock?.getElapsedTime();
        const currentTime = Date.now();

        const deltaTime = Math.max(currentTime - startTime, 14);

        // world!.controls!.update();
        world.physicsWorld.step();
        await world.player?.update(deltaTime, elapsedTime || 0);

        requestAnimationFrame(animate);

        if (world?.scene && world?.camera) {
            world?.renderer?.render(world?.scene, world?.camera);
        }
    } catch (error) {
        console.log(error);
    }
}

start();
