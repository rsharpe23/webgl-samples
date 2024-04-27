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

class GLTF {
  constructor(data, meshes) {
    this.data = data;
    this.meshes = meshes;
  }

  static from(data) {
    const meshes = Array.from(MeshList.from(data));
    return new GLTF(data, meshes);
  }

  getScene() {
    const { scene, scenes, nodes } = this.data;
    const { nodes: n } = scenes[scene];
    return n.map(index => this.getNodeTree(nodes[index]));
  }

  getNodeTree(root) {
    const { children } = root;
    if (children && children.length > 0) {
      root.children = children.map(
        index => this.getNodeTree(this.data.nodes[index]));
    }

    return this.getNode(root);
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

  static from({ meshes, accessors, bufferViews, buffers }) {
    const meshProvider = new MeshProvider(accessors, bufferViews, buffers);
    return new MeshList(meshes, meshProvider);
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
  
  getMeshPrimitive({ attributes, indices: i }) {
    const attrs = Object.entries(attributes)
      .reduce((attr, [key, value]) => {
        attr[key] = this.getAccessor(this.accessors[value]);
        return attr;
      }, {});
      
    const indices = this.getAccessor(this.accessors[i]);

    return { attrs, indices };
  }
  
  getAccessor({ bufferView: bv, type, componentType, count }) {
    const bufferView = this.getBufferView(this.bufferViews[bv]);
    const componentsNum = getComponentsNum(type);
    return { bufferView, componentType, componentsNum, count };
  }
  
  getBufferView({ buffer, byteOffset, byteLength, target }) {
    const data = new Uint8Array(
      this.buffers[buffer], byteOffset, byteLength);

    return { target, data };
  }
}

function getComponentsNum(attrType) {
  const typeMap = getComponentsNum.typeMap 
    ||= {
      'SCALAR': 1,
      'VEC2': 2,
      'VEC3': 3,
    };
  
  return typeMap[attrType];
}

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
          cb && cb(GLTF.from(data));
        });
    });
}

function getURL(path, file) {
  return `${path}/${file ?? getFile(path)}`;
}

function getFile(path) {
  return path.split('/').pop() + '.gltf';
}