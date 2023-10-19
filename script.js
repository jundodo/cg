import * as THREE from 'https://threejs.org/build/three.module.js';

let scene, camera, renderer;
let controlPoints = [];
let curveObject;
let newCurveObject;
let addingNewPoints = false;
let newControlPoints = [];
let controlWeights=[];
let newControlWeights=[];
let curves=[];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedObject = null;
let isDragging = false;

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
window.addEventListener('mousemove', onDocumentMouseMove, false);
window.addEventListener('mouseup', onDocumentMouseUp, false);
function onDocumentMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (selectedObject) {
        const intersects = raycaster.intersectObject(selectedObject);
        if (intersects.length > 0) {
            selectedObject.position.set(intersects[0].point.x, intersects[0].point.y, 0);
            updateCurve();
        }
    }
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    // 이미 존재하는 컨트롤 포인트 선택
    if (intersects.length > 0 && (intersects[0].object.material.color.getHex() === 0xff0000 || intersects[0].object.material.color.getHex() === 0x0000ff)) {
        selectedObject = intersects[0].object;
        isDragging = true;
        return;  // 선택된 점을 드래그하기 위해 나머지 코드 실행 중지
    }
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

    if (intersects.length > 0 && (intersects[0].object.material.color.getHex() === 0xff0000 || intersects[0].object.material.color.getHex() === 0x0000ff)) {
        selectedObject = intersects[0].object;
        isDragging = true;
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
        newControlWeights.push(1.0);

    } else {
        controlPoints.push(circle.position);
        controlWeights.push(1.0);
    }
    if (addingNewPoints) {
        if (newControlPoints.length >= 3) {
            if(newCurveObject) { // 이미 존재하는 노란색 곡선 삭제
                scene.remove(newCurveObject);
            }
            newCurveObject = drawCurve(newControlPoints, 0xffff00);
        }
    } else {
        if (controlPoints.length >= 3) {
            if(curveObject) { // 이미 존재하는 초록색 곡선 삭제
                scene.remove(curveObject);
            }
            curveObject = drawCurve(controlPoints, 0x00ff00);
        }
    }
}
function onDocumentMouseUp(event) {
    isDragging = false;
    selectedObject = null;
}
function updateCurve() {
    if (controlPoints.length >= 3) {
        if(curveObject) {
            scene.remove(curveObject);
        }
        curveObject = drawCurve(controlPoints, 0x00ff00);
    }

    if (newControlPoints.length >= 3) {
        if(newCurveObject) {
            scene.remove(newCurveObject);
        }
        newCurveObject = drawCurve(newControlPoints, 0xffff00);
    }
}
//added
function createOpenKnotVector(n, p) {
    const m = n + p + 1;
    const knots = [];

    for (let i = 0; i <= m; i++) {
        if (i < p) {
            knots.push(0);
        } else if (i <= n) {
            knots.push(i - p + 1);
        } else {
            knots.push(n - p + 2);
        }
    }
    console.log("Knot vector:", knots);
    return knots;
}

//ADDED
function drawCurve(points, color) {
    const curvePoints = [];
    const n = points.length - 1;
    const p = 3;  // Cubic B-spline
    const uMax = n - p + 2;
    for (let u = 0; u <= uMax; u += 0.01) {
        curvePoints.push(computeNURBS(points, u));
    }

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({ color });
    const curveObj = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveObj);

    return curveObj; // 새로 생성된 커브 객체 반환
}
function computeNURBS(controlPoints, u) {
    const n = controlPoints.length - 1;
    let point = new THREE.Vector2();

    const knots = createOpenKnotVector(n, 3);

    // NURBS 계산 로직 추가 (예: 가중치를 고려하여 point를 계산)

    for (let i = 0; i <= n; i++) {
        const Ni = N(i, 2, u, knots);
        point.x += controlPoints[i].x * Ni;
        point.y += controlPoints[i].y * Ni;
    }

    if (isNaN(point.x) || isNaN(point.y)) {
        console.error("NaN detected in computeNURBS:", point, "at u =", u);
    }
    
    return point;
}


function N(i, k, u, knots) {
    // Base case for the recursive function
    if (k === 0) {
        return (u >= knots[i] && u < knots[i+1]) ? 1 : 0;
    }

    let term1 = 0;
    let term2 = 0;

    if (knots[i+k] - knots[i] != 0) {
        term1 = ((u - knots[i]) / (knots[i+k] - knots[i])) * N(i, k-1, u, knots);
    }

    if (knots[i+k+1] - knots[i+1] != 0) {
        term2 = ((knots[i+k+1] - u) / (knots[i+k+1] - knots[i+1])) * N(i+1, k-1, u, knots);
    }

    let result = term1 + term2;
    
    return result;
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