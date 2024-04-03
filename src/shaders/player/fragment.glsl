varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform bool canStart;
uniform sampler2D uNoiseTexture;
uniform vec2 uResolution;
uniform vec3 uCameraPosition;

vec2 random(vec2 uv){
    uv = vec2( dot(uv, vec2(127.1,311.7) ),
               dot(uv, vec2(269.5,183.3) ) );
    return -1.0 + 2.0 * fract(sin(uv) * 43758.5453123);
}

float noise(vec2 uv) {
    vec2 uv_index = floor(uv);
    vec2 uv_fract = fract(uv);

    vec2 blur = smoothstep(0.0, 1.0, uv_fract);

    return mix( mix( dot( random(uv_index + vec2(0.0,0.0) ), uv_fract - vec2(0.0,0.0) ),
                     dot( random(uv_index + vec2(1.0,0.0) ), uv_fract - vec2(1.0,0.0) ), blur.x),
                mix( dot( random(uv_index + vec2(0.0,1.0) ), uv_fract - vec2(0.0,1.0) ),
                     dot( random(uv_index + vec2(1.0,1.0) ), uv_fract - vec2(1.0,1.0) ), blur.x), blur.y) * 0.5 + 0.5;
}

vec3 getFresnel(){
    float fresnel = dot(normalize(uCameraPosition - vPosition), normalize(vNormal));
    float str = 1.0 - fresnel;
    vec3 color = vec3(1.0, 0.6, 0.0);
    vec3 outerColor = color * str;
    vec3 innerColor = color * fresnel;
    vec3 mixColor = mix(outerColor, innerColor, 0.2);

    return mixColor;
}

float swirl(vec2 uv, float size, int arms)
{
	float angle = atan(-uv.y + 0.5, uv.x - 0.5) ;
	float len = length(uv - vec2(0.5, 0.5));
	
	return sin(len * size + angle * float(arms));
}

vec3 fresnel_glow(float amount, float intensity, vec3 color, vec3 normal, vec3 view)
{
	return pow((1.0 - dot(normalize(normal), normalize(view))), amount) * color * intensity;
}

vec2 rotate(vec2 uv, vec2 pivot, float angle)
{
	mat2 rotation = mat2(vec2(sin(angle), -cos(angle)),
						vec2(cos(angle), sin(angle)));
	
	uv -= pivot;
	uv = uv * rotation;
	uv += pivot;
	return uv;
}


vec4 rotatedSwirl(){
    vec2 newUv = vUv;
    newUv = rotate(vUv, vec2(0.5), uTime * 4.0);

    float swirl = swirl(newUv , 50.0, 6);
	vec4 color = vec4(vec3(swirl), 1.0);

    return color;
}

vec3 getFresnel2(){
    vec3 base_color = vec3(0.5, 0.2, 0.9);
	vec3 fresnel_color = vec3(0.0, 0.7, 0.9);
	vec3 fresnel = fresnel_glow(4.0, 4.5, fresnel_color, vNormal, vec3(0.5, 0.5, 0.5));

    

    return base_color + fresnel;
}

vec4 getDissolve(){
    vec4 tex = vec4(getFresnel(), 0.5 );

    // if(!canStart){
    //     return tex;
    // }
	
	float noise = noise(vUv * 60.0) * vUv.x;
    float progress = abs(sin(uTime)) * float(canStart);
	
	float d1 = step(progress, noise);
	float d2 = step(progress - 0.1, noise);
	
	vec3 beam = vec3(d2 - d1) * vec3(0.0, 1.0, 0.0);;
	
	tex.rgb += beam;
	tex.a *= d2;
	return tex;
}

vec4 getShockWave(){
    float wave = mod(uTime, 1.2);
    float radius = wave * 0.5;
    float width = 0.04;
    float feather = 0.04;
    float aberration = 0.4;
    vec2 center = vec2(0.5, 0.5);
	vec2 dist_center = vec2(vUv.x - center.y);
	float mask =  (1.0 - smoothstep(radius-feather, radius, vUv.x - 0.4)) * smoothstep(radius - width - feather, radius-width , vUv.x - 0.4);


    // color.r = step(0.5, color.r);
    // color.g = step(0.5, color.g);
    // color.b = step(0.5, color.b);
    // color.b = 0.0;

    vec3 slash = vec3(mask);
    vec3 yellowColor = vec3(1.0, 1.0, 0.0);
    vec3 yellowSlash = slash * yellowColor;

    return vec4(yellowSlash, 0.5);
}


void main(){

    // gl_FragColor = vec4(getFresnel(), 0.5 );
    // gl_FragColor = getDissolve();
    // gl_FragColor = getShockWave();

    float currentDistance = distance(gl_FragCoord.xy, uResolution/2.0);
    float speed = 50.0;
    float timePart = mod(speed * uTime, 250.0);
    vec2 textureCoord = vec2(gl_FragCoord.x,  gl_FragCoord.y - timePart);
    vec4 text = texture(uNoiseTexture, textureCoord * 0.0004 );
    float i = text.x / 2.0;

    float a = pow(max(0.0, 1.0 - currentDistance / 6000.0), 2.0);
    a /= i; 

    vec4 color = vec4(getFresnel() * a, 0.4);  
    vec4 shockColor = getShockWave();
    gl_FragColor = mix(color, shockColor, 0.5);
    // gl_FragColor = shockColor;
}