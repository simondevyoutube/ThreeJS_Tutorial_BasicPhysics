import * as THREE from 'https://cdn.skypack.dev/three@0.136';

import {OrbitControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';

const DEFAULT_MASS = 10;


class RigidBody {
  constructor() {
  }

  setRestitution(val) {
    this.body_.setRestitution(val);
  }

  setFriction(val) {
    this.body_.setFriction(val);
  }

  setRollingFriction(val) {
    this.body_.setRollingFriction(val);
  }

  createBox(mass, pos, quat, size) {
    this.transform_ = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    this.shape_ = new Ammo.btBoxShape(btSize);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape_.calculateLocalInertia(mass, this.inertia_);
    }

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
        mass, this.motionState_, this.shape_, this.inertia_);
    this.body_ = new Ammo.btRigidBody(this.info_);

    Ammo.destroy(btSize);
  }

  createSphere(mass, pos, size) {
    this.transform_ = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    this.shape_ = new Ammo.btSphereShape(size);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) {
      this.shape_.calculateLocalInertia(mass, this.inertia_);
    }

    this.info_ = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState_, this.shape_, this.inertia_);
    this.body_ = new Ammo.btRigidBody(this.info_);
  }
}


class BasicWorldDemo {
  constructor() {
  }

  initialize() {
    this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collisionConfiguration_);
    this.broadphase_ = new Ammo.btDbvtBroadphase();
    this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(
        this.dispatcher_, this.broadphase_, this.solver_, this.collisionConfiguration_);
    this.physicsWorld_.setGravity(new Ammo.btVector3(0, -100, 0));

    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.shadowMap.enabled = true;
    this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.onWindowResize_();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(75, 20, 0);

    this.scene_ = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this.scene_.add(light);

    light = new THREE.AmbientLight(0x101010);
    this.scene_.add(light);

    const controls = new OrbitControls(
      this.camera_, this.threejs_.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    this.scene_.background = texture;

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100),
      new THREE.MeshStandardMaterial({color: 0x404040}));
    ground.castShadow = false;
    ground.receiveShadow = true;
    this.scene_.add(ground);

    const rbGround = new RigidBody();
    rbGround.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(100, 1, 100));
    rbGround.setRestitution(0.99);
    this.physicsWorld_.addRigidBody(rbGround.body_);

    this.rigidBodies_ = [];

    // const box = new THREE.Mesh(
    //   new THREE.BoxGeometry(4, 4, 4),
    //   new THREE.MeshStandardMaterial({color: 0x808080}));
    // box.position.set(0, 40, 0);
    // box.castShadow = true;
    // box.receiveShadow = true;
    // this.scene_.add(box);

    // const rbBox = new RigidBody();
    // rbBox.createBox(1, box.position, box.quaternion, new THREE.Vector3(4, 4, 4));
    // rbBox.setRestitution(0.25);
    // rbBox.setFriction(1);
    // rbBox.setRollingFriction(5);
    // this.physicsWorld_.addRigidBody(rbBox.body_);
    
    // this.rigidBodies_.push({mesh: box, rigidBody: rbBox});

    let isSphere = true;
    for (let x = -4; x < 4; ++x) {
      for (let y = -4; y < 4; ++y) {
        if (isSphere) {
          const box = new THREE.Mesh(
            new THREE.SphereGeometry(4),
            new THREE.MeshStandardMaterial({color: 0x808080}));
          box.position.set(x * 10, Math.random() * 20 + 40, y * 10);
          box.castShadow = true;
          box.receiveShadow = true;
          this.scene_.add(box);
      
          const rbBox = new RigidBody();
          rbBox.createSphere(1, box.position, 4);
          rbBox.setRestitution(0.5);
          rbBox.setFriction(1);
          rbBox.setRollingFriction(1);
          this.physicsWorld_.addRigidBody(rbBox.body_);
          
          this.rigidBodies_.push({mesh: box, rigidBody: rbBox});
        } else {
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshStandardMaterial({color: 0x808080}));
          box.position.set(x * 10, Math.random() * 5 + 40, y * 10);
          box.castShadow = true;
          box.receiveShadow = true;
          this.scene_.add(box);
      
          const rbBox = new RigidBody();
          rbBox.createBox(1, box.position, box.quaternion, new THREE.Vector3(4, 4, 4));
          rbBox.setRestitution(0.25);
          rbBox.setFriction(1);
          rbBox.setRollingFriction(5);
          this.physicsWorld_.addRigidBody(rbBox.body_);
          
          this.rigidBodies_.push({mesh: box, rigidBody: rbBox});
        }
        isSphere = !isSphere;
      }
    }

    this.tmpTransform_ = new Ammo.btTransform();

    this.countdown_ = 1.0;
    this.count_ = 0;
    this.previousRAF_ = null;
    this.raf_();
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.step_(t - this.previousRAF_);
      this.threejs_.render(this.scene_, this.camera_);
      this.raf_();
      this.previousRAF_ = t;
    });
  }

  spawn_() {
    const scale = Math.random() * 4 + 4;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(scale, scale, scale),
      new THREE.MeshStandardMaterial({
          color: 0x808080,
      }));
    box.position.set(Math.random() * 2 - 1, 200.0, Math.random() * 2 - 1);
    box.quaternion.set(0, 0, 0, 1);
    box.castShadow = true;
    box.receiveShadow = true;

    const rb = new RigidBody();
    rb.createBox(DEFAULT_MASS, box.position, box.quaternion, new THREE.Vector3(scale, scale, scale), null);
    rb.setRestitution(0.125);
    rb.setFriction(1);
    rb.setRollingFriction(5);

    this.physicsWorld_.addRigidBody(rb.body_);

    this.rigidBodies_.push({mesh: box, rigidBody: rb});

    this.scene_.add(box);
  }

  step_(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;

    this.countdown_ -= timeElapsedS;
    if (this.countdown_ < 0 && this.count_ < 10) {
      this.countdown_ = 0.25;
      this.count_ += 1;
      this.spawn_();
    }

    this.physicsWorld_.stepSimulation(timeElapsedS, 10);

    for (let i = 0; i < this.rigidBodies_.length; ++i) {
      this.rigidBodies_[i].rigidBody.motionState_.getWorldTransform(this.tmpTransform_);
      const pos = this.tmpTransform_.getOrigin();
      const quat = this.tmpTransform_.getRotation();
      const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
      const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

      this.rigidBodies_[i].mesh.position.copy(pos3);
      this.rigidBodies_[i].mesh.quaternion.copy(quat3);
    }
  }
}


let APP_ = null;

window.addEventListener('DOMContentLoaded', async () => {
  Ammo().then((lib) => {
    Ammo = lib;
    APP_ = new BasicWorldDemo();
    APP_.initialize();
  });
});
