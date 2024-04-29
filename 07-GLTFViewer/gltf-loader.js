// Сцена - это ноды в древовидной структуре, т.е. граф.

// Main -> WebGLRenderer
// Scene -> SceneRenderer

// Mesh -> name, primitives
// Primitive -> attrs (accessors), indices (accessor)
// Accessor -> bufferView, componentType, componentsNum, count
// BufferView -> target, data

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
//     matrix: null,
//     mesh: meshes[0],
//     children: [
//       {
//         name: 'C',
//         mesh: meshes[0],
//         matrix: null,
//       }
//     ],
//   },
//   {
//     name: 'B',
//     mesh: meshes[0],
//     matrix: null,
//   }
// ];

// const sceneAdapter = [
//   {
//     name: 'A',
//     matrix: null,
//     mesh: [
//       {
//         attrs: {
//           0: {
//             buffer: null,
//             componentType: 5126,
//             numComponents: 3,
//           },
//           1: {
//             buffer: null,
//             componentType: 5126,
//             numComponents: 3,
//           },
//         },
//         indices: {
//           buffer: null,
//           componentType: 5123,
//           count: 36,
//         },
//       }
//     ],
//     children: [],
//   }
// ];

class GLTF {
  constructor(data) {
    this.data = data;
  }

  getScene() {
    const { scene, scenes, ...rest } = this.data;
    return ((s, d) => {
      const sceneProvider = getSceneProvider(d);
      return sceneProvider.getScene(s);

    })(scenes[scene], rest); 
  }
}

function getSceneProvider({ nodes, meshes, accessors, bufferViews, buffers }) {
  const meshProvider = new MeshProvider(accessors, bufferViews, buffers);
  const _meshes = Array.from(new MeshList(meshes, meshProvider));
  return new SceneProvider(nodes, _meshes);
}

class SceneProvider {
  constructor(nodes, meshes) {
    this.nodes = nodes;
    this.meshes = meshes;
  }

  getScene({ nodes }) {
    return nodes.map(node => this.getNodeTree(node));
  }

  getNodeTree(root) {
    return (({ children, ...rest }) => {
      if (children && children.length > 0) {
        rest.children = children.map(child => this.getNodeTree(child));
      }
      return rest;

    })(this.getNode(this.nodes[root]));
  }

  getNode({ mesh: m, ...rest }) {
    return { ...rest, mesh: this.meshes[m] };
  }
}

class MeshList {
  constructor(meshes, meshProvider) {
    this.meshes = meshes;
    this.meshProvider = meshProvider;
  }

  *[Symbol.iterator]() {
    for (const mesh of this.meshes) {
      yield this.meshProvider.getMesh(mesh);
    }
  }
}

class MeshProvider {
  constructor(accessors, bufferViews, buffers) {
    this.accessors = accessors;
    this.bufferViews = bufferViews;
    this.buffers = buffers; 
  }

  getMesh({ name, primitives: prims }) {
    const primitives = prims.map(p => this.getMeshPrimitive(p));
    return { name, primitives };
  }
  
  getMeshPrimitive({ attributes: a, indices: i }) {
    const attributes = Object.entries(a)
      .reduce((attr, [key, value]) => {
        attr[key] = this.getAccessor(this.accessors[value]);
        return attr;
      }, {});
      
    const indices = this.getAccessor(this.accessors[i]);

    return { attributes, indices };
  }
  
  getAccessor({ bufferView: bv, ...rest }) {
    const bufferView = this.getBufferView(this.bufferViews[bv]);
    return { ...rest, bufferView };
  }
  
  getBufferView({ buffer, byteOffset, byteLength, target }) {
    const data = new Uint8Array(
      this.buffers[buffer], byteOffset, byteLength);

    return { target, data };
  }
}

// function getComponentsNum(attrType) {
//   const typeMap = getComponentsNum.typeMap 
//     ||= {
//       'SCALAR': 1,
//       'VEC2': 2,
//       'VEC3': 3,
//     };
  
//   return typeMap[attrType];
// }

// function trsToMatrix(trs) {
//   return [];
// }

function loadGLTF(path, cb) {
  fetch(getURL(path)).then(res => res.json())
    .then(data => {
      const { uri } = data.buffers[0];
      fetch(getURL(path, uri)).then(res => res.arrayBuffer())
        .then(buffer => {
          data.buffers[0] = buffer;
          cb && cb(new GLTF(data));
        });
    });
}

function getURL(path, file = getFile(path)) {
  return `${path}/${file}`;
}

function getFile(path) {
  return path.split('/').pop() + '.gltf';
}