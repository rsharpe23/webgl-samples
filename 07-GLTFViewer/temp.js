// Mesh -> name, primitives
// Primitive -> attrs (accessors), indices (accessor)
// Accessor -> bufferView, componentType, componentsNum, count
// BufferView -> target, data

// Main -> WebGLRenderer
// Scene -> SceneRenderer

// Сцена - это ноды в древовидной структуре, т.е. граф.

const meshes = [
  {
    name: 'A',
    primitives: [
      {
        attributes: {
          POSITION: {
            bufferView: { 
              target: 34962, 
              data: null 
            },
            componentType: 5126,
            componentsNum: 3,
            count: 24,
          },
          NORMAL: {
            bufferView: { 
              target: 34962, 
              data: null 
            },
            componentType: 5126,
            componentsNum: 3,
            count: 24,
          },
          TEXCOORD_0: {
            bufferView: { 
              target: 34962, 
              data: null 
            },
            componentType: 5126,
            componentsNum: 2,
            count: 24,
          },
        },
        indices: {
          bufferView: { 
            target: 34963, 
            data: null 
          },
          componentType: 5123,
          componentsNum: 1,
          count: 36,
        },
      }
    ],
  },
];

const scene = [
  {
    name: 'A',
    mesh: meshes[0],
    matrix: [],
    children: [
      {
        name: 'C',
        mesh: meshes[0],
        matrix: [],
      }
    ],
  },
  {
    name: 'B',
    mesh: meshes[0],
    matrix: [],
  }
];