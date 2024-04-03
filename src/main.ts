import './style.css';
import World from './models/world';

let world: World | null = null;
const startTime = Date.now();

async function start() {
    world = await World.init();

    animate();
}

async function animate() {
    const elapsedTime = world!.clock!.getElapsedTime();
    const currentTime = Date.now();

    const deltaTime = Math.max(currentTime - startTime, 14);

    world!.controls.update();
    await world!.player!.update(deltaTime, elapsedTime);

    requestAnimationFrame(animate);
    world!.renderer!.render(world!.scene!, world!.camera!);
}

start();
