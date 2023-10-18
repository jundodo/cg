import * as THREE from 'https://threejs.org/build/three.module.js';

let scene, camera, renderer;
let controlPoints = [];
let curveObject;
let newCurveObject;
let addingNewPoints = false;
let newControlPoints = [];


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
    document.getElementById('resetButton').addEventListener('click', resetScene);
    document.getElementById('newCurveButton').addEventListener('click', function() {
        addingNewPoints = true;
        removeExistingNewPoints();
    });
}

function onDocumentMouseDown(event) {
    const resetButton = document.getElementById('resetButton');
    const rect = resetButton.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
        return; // 버튼 영역 클릭 시 함수 종료
    }
    const newButton = document.getElementById('newCurveButton');
    const newct=newButton.getBoundingClientRect();
    if (event.clientX >= newct.left && event.clientX <= newct.right &&
        event.clientY >= newct.top && event.clientY <= newct.bottom) {
        return; // 버튼 영역 클릭 시 함수 종료
    }

    // 마우스 클릭 위치 계산
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // 점 (원) 생성
    const geometry = new THREE.CircleGeometry(5, 32);
    const material = new THREE.MeshBasicMaterial({ color: addingNewPoints ? 0x0000ff : 0xff0000 }); // 새로운 점들의 색상 조절
    const circle = new THREE.Mesh(geometry, material);
    
    // 카메라를 사용하여 2D 환경에서의 마우스 위치로 점을 옮김
    circle.position.set(mouseX * window.innerWidth / 2, mouseY * window.innerHeight / 2, 0);

    // 점을 씬에 추가
    scene.add(circle);

    // 점을 적절한 배열에 추가
    if (addingNewPoints) {
        newControlPoints.push(circle.position);

    } else {
        controlPoints.push(circle.position);
    }

    //적절한 배열의 길이에 따라 B-spline 곡선 생성(기존)
    if (addingNewPoints) {
        if (newControlPoints.length >= 3) {
            drawCurve(newControlPoints, 0xffff00, newCurveObject);
        }
    } else {
        if (controlPoints.length >= 3) {
            drawCurve(controlPoints, 0x00ff00, curveObject);
        }
    }
    
}

function drawCurve(points, color, curveObj) {        //기존
    const curvePoints = [];
    for (let u = 0; u <= points.length; u += 0.01) {
        curvePoints.push(computeBSpline(points, u));
    }

    if (curveObj) {
        scene.remove(curveObj); // 기존 곡선 제거
    }

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({ color });
    curveObj = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveObj);
}


function computeBSpline(controlPoints, u) { //기존!!
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

function resetScene() {
    // 컨트롤 포인트 배열들 초기화
    controlPoints.length = 0;
    newControlPoints.length = 0;

    // scene에서 모든 Mesh와 Line 객체들 제거
    const objectsToRemove = [];
    scene.children.forEach(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            objectsToRemove.push(object);
        }
    });
    objectsToRemove.forEach(object => scene.remove(object));

    // curve 객체들 null로 설정
    curveObject = null;
    newCurveObject = null;

    // 새로운 컨트롤 포인트 추가 상태 해제
    addingNewPoints = false;
}
