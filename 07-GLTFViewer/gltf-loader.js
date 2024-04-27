class GLTF {
  constructor(data) {
    this.data = data;
    this.meshes = MeshList.fromData(data);
  }

  // getNodeTree(rootNode) {
  //   const node = this.getNode(rootNode);

  //   const { children } = rootNode;
  //   if (children && children.length > 0) {
  //     node.children = children.map(child => this.getNodeTree(child));
  //   }

  //   return node;
  // }

  // getNode({ name, mesh: m, ...rest }) {
  //   const mesh = this.meshes[m];
  //   const matrix = trsToMatrix(rest);
  //   return { name, mesh, matrix };
  // }
}

class MeshList {
  constructor(meshes, meshProvider) {
    this.meshes = meshes;
    this.meshProvider = meshProvider;
  }

  static fromData({ meshes, accessors, bufferViews, buffers }) {
    const meshProvider = new MeshProvider(accessors, bufferViews, buffers);
    return Array.from(new MeshList(meshes, meshProvider));
  }

  *[Symbol.iterator]() {
    for (const mesh of this.meshes) {
      yield this.meshProvider.getMesh(mesh);
    }
  }
}

class MeshProvider {
  constructor(accessors, bufferViews, buffer) {
    this.accessors = accessors;
    this.bufferViews = bufferViews;
    this.buffer = buffer; 
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
    const data = new Uint8Array(this.buffer, byteOffset, byteLength);
    return { target, data };
  }
}

// function getScene({ data: { scene, scenes, nodes }, nodeProvider }) {
//   return scenes[scene].map(node => nodeProvider.getNodeTree(nodes[node]));
// }

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