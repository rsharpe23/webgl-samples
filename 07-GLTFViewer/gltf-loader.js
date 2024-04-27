class GLTF {
  _meshes = null;
  _scene = null;

  constructor(data, meshProvider) {
    this.data = data;
    this.meshProvider = meshProvider;
  }

  static fromData(data) {
    return new GLTF(data, new MeshProvider(data));
  }

  get meshes() {
    if (!this._meshes) {
      this._meshes = getMeshes(this);
    }
    return this._meshes;
  }

  get scene() {
    if (!this._scene) {
      const { scenes, scene, nodes } = this.data;
      this._scene = scenes[scene]
        .map(node => this.getNodeTree(nodes[node]));
    }

    return this._scene;
  }

  // #meshes = null;
  // get meshes() {
  //   if (!this.#meshes) {
  //     const { meshes } = this.data;
  //     this.#meshes = meshes.map(mesh => this.#getMesh(mesh));
  //   }

  //   return this.#meshes;
  // }

  // #scene = null;
  // get scene() {
  //   if (!this.#scene) {
  //     const { nodes } = this.data.scenes[this.data.scene];
  //     this.#scene = nodes.map(
  //       node => this.#getNodeTree(this.data.nodes[node]));
  //   }

  //   return this.#scene;
  // }

  getMeshes(meshes) {
    return meshes.map(mesh => this.meshProvider.getMesh(mesh));
  }

  getScene(nodes) {

  }

  getNodeTree(rootNode) {
    const node = this.getNode(rootNode);

    const { children } = rootNode;
    if (children && children.length > 0) {
      node.children = children.map(child => this.getNodeTree(child));
    }

    return node;
  }

  getNode({ name, mesh: m, ...rest }) {
    const mesh = this.meshes[m];
    const matrix = trsToMatrix(rest);
    return { name, mesh, matrix };
  }
}

class MeshProvider {
  constructor(data) {
    this.data = data;
  }

  get accessors() {
    return this.data.accessors;
  }

  get bufferViews() {
    return this.data.bufferViews;
  }

  get arrayBuffer() {
    return this.data.buffers[0];
  }

  getMesh({ name, primitives: p }) {
    const primitives = p.map(item => this.getMeshPrimitive(item));
    return { name, primitives };
  }
  
  getMeshPrimitive({ attributes: a, indices: i }) {
    const attrs = Object.entries(a)
      .reduce((attr, [key, value]) => {
        attr[key] = this.getAccessor(this.accessors[value]);
        return attr;
      }, {});
      
    const indices = this.getAccessor(this.accessors[i]);

    return { attrs, indices };
  }
  
  getAccessor({ bufferView: b, type, componentType, count }) {
    const bufferView = this.getBufferView(this.bufferViews[b]);
    const componentsNum = getComponentsNum(type);
    return { bufferView, componentType, componentsNum, count };
  }
  
  getBufferView({ byteOffset, byteLength, target }) {
    const data = new Uint8Array(this.arrayBuffer, byteOffset, byteLength);
    return { target, data };
  }
}

function getMeshes({ data, meshProvider }) {
  return data.meshes.map(mesh => meshProvider.getMesh(mesh));
}

function getScene({ data, sceneProvider }) {
  
}

function getComponentsNum(attrType) {
  const typeMap = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
  };
  
  return typeMap[attrType];
}

function trsToMatrix(trs) {
  return [];
}

function loadGLTF(url, cb) {
  fetch(url).then(res => res.json())
    .then(data => {
      const { uri } = data.buffers[0];
      fetch(uri).then(res => res.arrayBuffer())
        .then(buffer => {
          data.buffers = [buffer];
          cb && cb(new GLTF(data));
        });
    });
}

// Mesh -> name, primitives
// Primitive -> attrs (accessors), indices (accessor)
// Accessor -> bufferView, componentType, componentsNum, count
// BufferView -> target, data

// Main -> WebGLRenderer
// Scene -> SceneRenderer

// Сцена - это ноды в древовидной структуре, т.е. граф.

// const meshes = [
//   {
//     name: 'A',
//     primitives: [
//       {
//         attributes: {
//           POSITION: {
//             bufferView: { 
//               target: 34962, 
//               data: null 
//             },
//             componentType: 5126,
//             componentsNum: 3,
//             count: 24,
//           },
//           NORMAL: {
//             bufferView: { 
//               target: 34962, 
//               data: null 
//             },
//             componentType: 5126,
//             componentsNum: 3,
//             count: 24,
//           },
//           TEXCOORD_0: {
//             bufferView: { 
//               target: 34962, 
//               data: null 
//             },
//             componentType: 5126,
//             componentsNum: 2,
//             count: 24,
//           },
//         },
//         indices: {
//           bufferView: { 
//             target: 34963, 
//             data: null 
//           },
//           componentType: 5123,
//           componentsNum: 1,
//           count: 36,
//         },
//       }
//     ],
//   },
// ];

// const scene = [
//   {
//     name: 'A',
//     mesh: meshes[0],
//     matrix: [],
//     children: [
//       {
//         name: 'C',
//         mesh: meshes[0],
//         matrix: [],
//       }
//     ],
//   },
//   {
//     name: 'B',
//     mesh: meshes[0],
//     matrix: [],
//   }
// ];

// ----------------

// class GLTF {
//   constructor(data) {
//     this.data = data;
//   }

//   #meshes = null;
//   get meshes() {
//     if (!this.#meshes) {
//       const { meshes } = this.data;
//       this.#meshes = meshes.map(mesh => this.#getMesh(mesh));
//     }

//     return this.#meshes;
//   }

//   #scene = null;
//   get scene() {
//     if (!this.#scene) {
//       const { nodes } = this.data.scenes[this.data.scene];
//       this.#scene = nodes.map(
//         node => this.#getNodeTree(this.data.nodes[node]));
//     }

//     return this.#scene;
//   }

//   get arrayBuffer() {
//     return this.data.buffers[0];
//   }

//   // --------

//   #getMesh({ name, primitives: p }) {
//     const primitives = p.map(item => this.#getMeshPrimitive(item));
//     return { name, primitives };
//   }
  
//   #getMeshPrimitive({ attributes: a, indices: i }) {
//     const { accessors } = this.data;

//     const attrs = Object.entries(a)
//       .reduce((attr, [key, value]) => {
//         attr[key] = this.#getAccessor(accessors[value]);
//         return attr;
//       }, {});
      
//     const indices = this.#getAccessor(accessors[i]);

//     return { attrs, indices };
//   }
  
//   #getAccessor({ bufferView: b, type, componentType, count }) {
//     const bufferView = this.#getBufferView(this.data.bufferViews[b]);
//     const componentsNum = typeUtil.getComponentsNum(type);
//     return { bufferView, componentType, componentsNum, count };
//   }
  
//   #getBufferView({ byteOffset, byteLength, target }) {
//     const data = new Uint8Array(this.arrayBuffer, byteOffset, byteLength);
//     return { target, data };
//   }

//   // ---------

//   #getNodeTree(rootNode) {
//     const node = this.#getNode(rootNode);

//     const { children } = rootNode;
//     if (children && children.length > 0) {
//       node.children = children.map(child => this.#getNodeTree(child));
//     }

//     return node;
//   }

//   #getNode({ name, mesh: m, ...rest }) {
//     const mesh = this.meshes[m];
//     const matrix = trsToMatrix(rest);
//     return { name, mesh, matrix };
//   }
// }