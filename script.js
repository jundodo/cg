import * as THREE from 'https://threejs.org/build/three.module.js';

let scene, camera, renderer;
let controlPoints = [];
let curveObject;

init();
animate();

function init() {
    // 씬 생성
    scene = new THREE.Scene();

    // 카메라 생성 (2D 환경을 위한 OrthographicCamera 사용)
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
    camera.position.z = 1;

    // 렌더러 설정
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 마우스 클릭 이벤트 리스너 추가 
    window.addEventListener('click', onDocumentMouseDown, false);
}

function onDocumentMouseDown(event) {
    // 마우스 클릭 위치 계산
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // 점 (원) 생성
    const geometry = new THREE.CircleGeometry(5, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const circle = new THREE.Mesh(geometry, material);
    
    // 카메라를 사용하여 2D 환경에서의 마우스 위치로 점을 옮김
    circle.position.set(mouseX * window.innerWidth / 2, mouseY * window.innerHeight / 2, 0);

    // 점을 씬에 추가
    scene.add(circle);

    controlPoints.push(circle.position);

    if (controlPoints.length >= 3) {
        const curvePoints = [];
        for (let u = 0; u <= controlPoints.length; u += 0.01) {
            curvePoints.push(computeBSpline(controlPoints, u));
        }

        if (curveObject) {
            scene.remove(curveObject); // 기존 곡선 제거
        }

        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        curveObject = new THREE.Line(curveGeometry, curveMaterial);
        scene.add(curveObject);
    }
}
function computeBSpline(controlPoints, u) {
    const n = controlPoints.length - 1;
    let point = new THREE.Vector2();

    const knots = [];

    // Create a uniform knot vector with duplicates at the beginning and end
    for (let i = 0; i <= n + 3; i++) {
        knots.push(i);
    }

    for (let i = 0; i <= n; i++) {
        const Ni = N(i, 2, u, knots);
        point.x += controlPoints[i].x * Ni;
        point.y += controlPoints[i].y * Ni;
    }
    
    return point;
}

function N(i, k, u, knots) {
    if (k === 0) {
        return (u >= knots[i] && u < knots[i + 1]) ? 1 : 0;
    }
    const a = (u - knots[i]) / (knots[i + k] - knots[i]) * (knots[i + k] !== knots[i] ? N(i, k - 1, u, knots) : 0);
    const b = (knots[i + k + 1] - u) / (knots[i + k + 1] - knots[i + 1]) * (knots[i + k + 1] !== knots[i + 1] ? N(i + 1, k - 1, u, knots) : 0);

    return a + b;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
