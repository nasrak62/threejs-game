varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform bool canStart;
uniform sampler2D uNoiseTexture;
uniform vec2 uResolution;

const float pi = 3.14285714286;


void main(){
    vec4 modelPosition = modelViewMatrix * vec4(position, 1.0);
    vec2 uBigWavesFrequency = vec2(1.0);
    float uBigWavesElevation = 1.0;
    float uBigWavesSpeed = 1.0;
    
    float elevation = sin(modelPosition.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) * sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) * uBigWavesElevation;
    modelPosition.y += elevation;
    
    gl_Position = projectionMatrix * modelPosition;
    vNormal = normal;
    vUv = uv;
    vPosition = position;
}