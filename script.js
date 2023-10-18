import * as THREE from 'https://threejs.org/build/three.module.js';

let scene, camera, renderer;

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
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
