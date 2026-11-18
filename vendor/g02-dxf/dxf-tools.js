/* OpenPlan3D@771c9e1 and dxf-writer@1.18.4. MIT notices in this directory. Generated with esbuild. */
var RubikDxfTools = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // dxf-writer@1.18.4/src/Handle.js
  var require_Handle = __commonJS({
    "dxf-writer@1.18.4/src/Handle.js"(exports, module) {
      var Handle = class _Handle {
        static seed = 0;
        static next() {
          return (++_Handle.seed).toString(16).toUpperCase();
        }
        static peek() {
          return (_Handle.seed + 1).toString(16).toUpperCase();
        }
      };
      module.exports = Handle;
    }
  });

  // dxf-writer@1.18.4/src/DatabaseObject.js
  var require_DatabaseObject = __commonJS({
    "dxf-writer@1.18.4/src/DatabaseObject.js"(exports, module) {
      var Handle = require_Handle();
      var DatabaseObject = class {
        constructor(subclass = null) {
          this.handle = Handle.next();
          this.ownerObjectHandle = "0";
          this.subclassMarkers = [];
          if (subclass) {
            if (Array.isArray(subclass)) {
              this.subclassMarkers.push(...subclass);
            } else {
              this.subclassMarkers.push(subclass);
            }
          }
        }
        /**
         *
         * @param {TagsManager} manager
         */
        tags(manager) {
          manager.push(5, this.handle);
          manager.push(330, this.ownerObjectHandle);
          for (const s of this.subclassMarkers) {
            manager.push(100, s);
          }
        }
      };
      module.exports = DatabaseObject;
    }
  });

  // dxf-writer@1.18.4/src/LineType.js
  var require_LineType = __commonJS({
    "dxf-writer@1.18.4/src/LineType.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var LineType = class extends DatabaseObject {
        /**
         * @param {string} name
         * @param {string} description
         * @param {array} elements - if elem > 0 it is a line, if elem < 0 it is gap, if elem == 0.0 it is a
         */
        constructor(name, description, elements) {
          super(["AcDbSymbolTableRecord", "AcDbLinetypeTableRecord"]);
          this.name = name;
          this.description = description;
          this.elements = elements;
        }
        tags(manager) {
          manager.push(0, "LTYPE");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(3, this.description);
          manager.push(70, 0);
          manager.push(72, 65);
          manager.push(73, this.elements.length);
          manager.push(40, this.getElementsSum());
          this.elements.forEach((element) => {
            manager.push(49, element);
            manager.push(74, 0);
          });
        }
        getElementsSum() {
          return this.elements.reduce((sum, element) => {
            return sum + Math.abs(element);
          }, 0);
        }
      };
      module.exports = LineType;
    }
  });

  // dxf-writer@1.18.4/src/Layer.js
  var require_Layer = __commonJS({
    "dxf-writer@1.18.4/src/Layer.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Layer = class extends DatabaseObject {
        constructor(name, colorNumber, lineTypeName = null) {
          super(["AcDbSymbolTableRecord", "AcDbLayerTableRecord"]);
          this.name = name;
          this.colorNumber = colorNumber;
          this.lineTypeName = lineTypeName;
          this.shapes = [];
          this.trueColor = -1;
        }
        tags(manager) {
          manager.push(0, "LAYER");
          super.tags(manager);
          manager.push(2, this.name);
          if (this.trueColor !== -1) manager.push(420, this.trueColor);
          else manager.push(62, this.colorNumber);
          manager.push(70, 0);
          if (this.lineTypeName) manager.push(6, this.lineTypeName);
          manager.push(390, 1);
        }
        setTrueColor(color) {
          this.trueColor = color;
        }
        addShape(shape) {
          this.shapes.push(shape);
          shape.layer = this;
        }
        getShapes() {
          return this.shapes;
        }
        shapesTags(space, manager) {
          for (const shape of this.shapes) {
            shape.ownerObjectHandle = space.handle;
            shape.tags(manager);
          }
        }
      };
      module.exports = Layer;
    }
  });

  // dxf-writer@1.18.4/src/Table.js
  var require_Table = __commonJS({
    "dxf-writer@1.18.4/src/Table.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Table = class extends DatabaseObject {
        constructor(name) {
          super("AcDbSymbolTable");
          this.name = name;
          this.elements = [];
        }
        add(element) {
          element.ownerObjectHandle = this.handle;
          this.elements.push(element);
        }
        tags(manager) {
          manager.push(0, "TABLE");
          manager.push(2, this.name);
          super.tags(manager);
          manager.push(70, this.elements.length);
          this.elements.forEach((element) => {
            element.tags(manager);
          });
          manager.push(0, "ENDTAB");
        }
      };
      module.exports = Table;
    }
  });

  // dxf-writer@1.18.4/src/DimStyleTable.js
  var require_DimStyleTable = __commonJS({
    "dxf-writer@1.18.4/src/DimStyleTable.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Table = require_Table();
      var DimStyleTable = class extends Table {
        constructor(name) {
          super(name);
          this.subclassMarkers.push("AcDbDimStyleTable");
        }
        tags(manager) {
          manager.push(0, "TABLE");
          manager.push(2, this.name);
          DatabaseObject.prototype.tags.call(this, manager);
          manager.push(70, this.elements.length);
          manager.push(71, 1);
          for (const e of this.elements) {
            e.tags(manager);
          }
          manager.push(0, "ENDTAB");
        }
      };
      module.exports = DimStyleTable;
    }
  });

  // dxf-writer@1.18.4/src/TextStyle.js
  var require_TextStyle = __commonJS({
    "dxf-writer@1.18.4/src/TextStyle.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var TextStyle = class extends DatabaseObject {
        fontFileName = "txt";
        constructor(name) {
          super(["AcDbSymbolTableRecord", "AcDbTextStyleTableRecord"]);
          this.name = name;
        }
        tags(manager) {
          manager.push(0, "STYLE");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(70, 0);
          manager.push(40, 0);
          manager.push(41, 1);
          manager.push(50, 0);
          manager.push(71, 0);
          manager.push(42, 1);
          manager.push(3, this.fontFileName);
          manager.push(4, "");
        }
      };
      module.exports = TextStyle;
    }
  });

  // dxf-writer@1.18.4/src/Viewport.js
  var require_Viewport = __commonJS({
    "dxf-writer@1.18.4/src/Viewport.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Viewport = class extends DatabaseObject {
        constructor(name, height) {
          super(["AcDbSymbolTableRecord", "AcDbViewportTableRecord"]);
          this.name = name;
          this.height = height;
        }
        tags(manager) {
          manager.push(0, "VPORT");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(40, this.height);
          manager.push(70, 0);
        }
      };
      module.exports = Viewport;
    }
  });

  // dxf-writer@1.18.4/src/AppId.js
  var require_AppId = __commonJS({
    "dxf-writer@1.18.4/src/AppId.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var AppId = class extends DatabaseObject {
        constructor(name) {
          super(["AcDbSymbolTableRecord", "AcDbRegAppTableRecord"]);
          this.name = name;
        }
        tags(manager) {
          manager.push(0, "APPID");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(70, 0);
        }
      };
      module.exports = AppId;
    }
  });

  // dxf-writer@1.18.4/src/Block.js
  var require_Block = __commonJS({
    "dxf-writer@1.18.4/src/Block.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Block = class extends DatabaseObject {
        constructor(name) {
          super(["AcDbEntity", "AcDbBlockBegin"]);
          this.name = name;
          this.end = new DatabaseObject(["AcDbEntity", "AcDbBlockEnd"]);
          this.recordHandle = null;
        }
        tags(manager) {
          manager.push(0, "BLOCK");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(70, 0);
          manager.point(0, 0);
          manager.push(3, this.name);
          manager.push(1, "");
          manager.push(0, "ENDBLK");
          this.end.tags(manager);
        }
      };
      module.exports = Block;
    }
  });

  // dxf-writer@1.18.4/src/BlockRecord.js
  var require_BlockRecord = __commonJS({
    "dxf-writer@1.18.4/src/BlockRecord.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var BlockRecord = class extends DatabaseObject {
        constructor(name) {
          super(["AcDbSymbolTableRecord", "AcDbBlockTableRecord"]);
          this.name = name;
        }
        tags(manager) {
          manager.push(0, "BLOCK_RECORD");
          super.tags(manager);
          manager.push(2, this.name);
          manager.push(70, 0);
          manager.push(280, 0);
          manager.push(281, 1);
        }
      };
      module.exports = BlockRecord;
    }
  });

  // dxf-writer@1.18.4/src/Dictionary.js
  var require_Dictionary = __commonJS({
    "dxf-writer@1.18.4/src/Dictionary.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Dictionary = class extends DatabaseObject {
        constructor() {
          super("AcDbDictionary");
          this.children = {};
        }
        /**
         *
         * @param {*} name
         * @param {DatabaseObject} dictionary
         */
        addChildDictionary(name, dictionary) {
          dictionary.ownerObjectHandle = this.handle;
          this.children[name] = dictionary;
        }
        tags(manager) {
          manager.push(0, "DICTIONARY");
          super.tags(manager);
          manager.push(281, 1);
          const entries = Object.entries(this.children);
          for (const entry of entries) {
            const [name, dic] = entry;
            manager.push(3, name);
            manager.push(350, dic.handle);
          }
          const children = Object.values(this.children);
          for (const c of children) {
            c.tags(manager);
          }
        }
      };
      module.exports = Dictionary;
    }
  });

  // dxf-writer@1.18.4/src/Line.js
  var require_Line = __commonJS({
    "dxf-writer@1.18.4/src/Line.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Line = class extends DatabaseObject {
        constructor(x1, y1, x2, y2) {
          super(["AcDbEntity", "AcDbLine"]);
          this.x1 = x1;
          this.y1 = y1;
          this.x2 = x2;
          this.y2 = y2;
        }
        tags(manager) {
          manager.push(0, "LINE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x1, this.y1);
          manager.push(11, this.x2);
          manager.push(21, this.y2);
          manager.push(31, 0);
        }
      };
      module.exports = Line;
    }
  });

  // dxf-writer@1.18.4/src/Line3d.js
  var require_Line3d = __commonJS({
    "dxf-writer@1.18.4/src/Line3d.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Line3d = class extends DatabaseObject {
        constructor(x1, y1, z1, x2, y2, z2) {
          super(["AcDbEntity", "AcDbLine"]);
          this.x1 = x1;
          this.y1 = y1;
          this.z1 = z1;
          this.x2 = x2;
          this.y2 = y2;
          this.z2 = z2;
        }
        tags(manager) {
          manager.push(0, "LINE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x1, this.y1, this.z1);
          manager.push(11, this.x2);
          manager.push(21, this.y2);
          manager.push(31, this.z2);
        }
      };
      module.exports = Line3d;
    }
  });

  // dxf-writer@1.18.4/src/Arc.js
  var require_Arc = __commonJS({
    "dxf-writer@1.18.4/src/Arc.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Arc = class extends DatabaseObject {
        /**
         * @param {number} x - Center x
         * @param {number} y - Center y
         * @param {number} r - radius
         * @param {number} startAngle - degree
         * @param {number} endAngle - degree
         */
        constructor(x, y, r, startAngle, endAngle) {
          super(["AcDbEntity", "AcDbCircle"]);
          this.x = x;
          this.y = y;
          this.r = r;
          this.startAngle = startAngle;
          this.endAngle = endAngle;
        }
        tags(manager) {
          manager.push(0, "ARC");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y);
          manager.push(40, this.r);
          manager.push(100, "AcDbArc");
          manager.push(50, this.startAngle);
          manager.push(51, this.endAngle);
        }
      };
      module.exports = Arc;
    }
  });

  // dxf-writer@1.18.4/src/Circle.js
  var require_Circle = __commonJS({
    "dxf-writer@1.18.4/src/Circle.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Circle = class extends DatabaseObject {
        /**
         * @param {number} x - Center x
         * @param {number} y - Center y
         * @param {number} r - radius
         */
        constructor(x, y, r) {
          super(["AcDbEntity", "AcDbCircle"]);
          this.x = x;
          this.y = y;
          this.r = r;
        }
        tags(manager) {
          manager.push(0, "CIRCLE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y);
          manager.push(40, this.r);
        }
      };
      module.exports = Circle;
    }
  });

  // dxf-writer@1.18.4/src/Cylinder.js
  var require_Cylinder = __commonJS({
    "dxf-writer@1.18.4/src/Cylinder.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Cylinder = class extends DatabaseObject {
        /**
         * @param {number} x - Center x
         * @param {number} y - Center y
         * @param {number} z - Center z
         * @param {number} r - radius
         * @param {number} thickness - thickness
         * @param {number} extrusionDirectionX - Extrusion Direction x
         * @param {number} extrusionDirectionY - Extrusion Direction y
         * @param {number} extrusionDirectionZ - Extrusion Direction z
         */
        constructor(x, y, z, r, thickness, extrusionDirectionX, extrusionDirectionY, extrusionDirectionZ) {
          super(["AcDbEntity", "AcDbCircle"]);
          this.x = x;
          this.y = y;
          this.z = z;
          this.r = r;
          this.thickness = thickness;
          this.extrusionDirectionX = extrusionDirectionX, this.extrusionDirectionY = extrusionDirectionY, this.extrusionDirectionZ = extrusionDirectionZ;
        }
        tags(manager) {
          manager.push(0, "CIRCLE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y, this.z);
          manager.push(40, this.r);
          manager.push(39, this.thickness);
          manager.push(210, this.extrusionDirectionX);
          manager.push(220, this.extrusionDirectionY);
          manager.push(230, this.extrusionDirectionZ);
        }
      };
      module.exports = Cylinder;
    }
  });

  // dxf-writer@1.18.4/src/Text.js
  var require_Text = __commonJS({
    "dxf-writer@1.18.4/src/Text.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var H_ALIGN_CODES = ["left", "center", "right"];
      var V_ALIGN_CODES = ["baseline", "bottom", "middle", "top"];
      var Text = class extends DatabaseObject {
        /**
         * @param {number} x - x
         * @param {number} y - y
         * @param {number} height - Text height
         * @param {number} rotation - Text rotation
         * @param {string} value - the string itself
         * @param {string} [horizontalAlignment="left"] left | center | right
         * @param {string} [verticalAlignment="baseline"] baseline | bottom | middle | top
         */
        constructor(x, y, height, rotation, value, horizontalAlignment = "left", verticalAlignment = "baseline") {
          super(["AcDbEntity", "AcDbText"]);
          this.x = x;
          this.y = y;
          this.height = height;
          this.rotation = rotation;
          this.value = value;
          this.hAlign = horizontalAlignment;
          this.vAlign = verticalAlignment;
        }
        tags(manager) {
          manager.push(0, "TEXT");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y);
          manager.push(40, this.height);
          manager.push(1, this.value);
          manager.push(50, this.rotation);
          if (H_ALIGN_CODES.includes(this.hAlign, 1) || V_ALIGN_CODES.includes(this.vAlign, 1)) {
            manager.push(72, Math.max(H_ALIGN_CODES.indexOf(this.hAlign), 0));
            manager.push(11, this.x);
            manager.push(21, this.y);
            manager.push(31, 0);
            manager.push(100, "AcDbText");
            manager.push(73, Math.max(V_ALIGN_CODES.indexOf(this.vAlign), 0));
          } else {
            manager.push(100, "AcDbText");
          }
        }
      };
      module.exports = Text;
    }
  });

  // dxf-writer@1.18.4/src/Polyline.js
  var require_Polyline = __commonJS({
    "dxf-writer@1.18.4/src/Polyline.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Polyline = class extends DatabaseObject {
        /**
         * @param {array} points - Array of points like [ [x1, y1], [x2, y2, bulge]... ]
         * @param {boolean} closed
         * @param {number} startWidth
         * @param {number} endWidth
         */
        constructor(points, closed = false, startWidth = 0, endWidth = 0) {
          super(["AcDbEntity", "AcDbPolyline"]);
          this.points = points;
          this.closed = closed;
          this.startWidth = startWidth;
          this.endWidth = endWidth;
        }
        tags(manager) {
          manager.push(0, "LWPOLYLINE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.push(6, "ByLayer");
          manager.push(62, 256);
          manager.push(370, -1);
          manager.push(90, this.points.length);
          manager.push(70, this.closed ? 1 : 0);
          this.points.forEach((point) => {
            const [x, y, z] = point;
            manager.push(10, x);
            manager.push(20, y);
            if (this.startWidth !== 0 || this.endWidth !== 0) {
              manager.push(40, this.startWidth);
              manager.push(41, this.endWidth);
            }
            if (z !== void 0) manager.push(42, z);
          });
        }
      };
      module.exports = Polyline;
    }
  });

  // dxf-writer@1.18.4/src/Vertex.js
  var require_Vertex = __commonJS({
    "dxf-writer@1.18.4/src/Vertex.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Vertex = class extends DatabaseObject {
        /**
         *
         * @param {number} x The X coordinate
         * @param {number} y The Y coordinate
         * @param {number} z The Z coordinate
         */
        constructor(x, y, z) {
          super(["AcDbEntity", "AcDbVertex", "AcDb3dPolylineVertex"]);
          this.x = x;
          this.y = y;
          this.z = z;
        }
        tags(manager) {
          manager.push(0, "VERTEX");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y, this.z);
          manager.push(70, 32);
        }
      };
      module.exports = Vertex;
    }
  });

  // dxf-writer@1.18.4/src/Polyline3d.js
  var require_Polyline3d = __commonJS({
    "dxf-writer@1.18.4/src/Polyline3d.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Handle = require_Handle();
      var Vertex = require_Vertex();
      var Polyline3d = class extends DatabaseObject {
        /**
         * @param {[number, number, number][]} points - Array of points like [ [x1, y1, z1], [x2, y2, z2]... ]
         */
        constructor(points) {
          super(["AcDbEntity", "AcDb3dPolyline"]);
          this.verticies = points.map((point) => {
            const [x, y, z] = point;
            const vertex = new Vertex(x, y, z);
            vertex.ownerObjectHandle = this.handle;
            return vertex;
          });
          this.seqendHandle = Handle.next();
        }
        tags(manager) {
          manager.push(0, "POLYLINE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.push(66, 1);
          manager.push(70, 0);
          manager.point(0, 0);
          this.verticies.forEach((vertex) => {
            vertex.layer = this.layer;
            vertex.tags(manager);
          });
          manager.push(0, "SEQEND");
          manager.push(5, this.seqendHandle);
          manager.push(100, "AcDbEntity");
          manager.push(8, this.layer.name);
        }
      };
      module.exports = Polyline3d;
    }
  });

  // dxf-writer@1.18.4/src/Face.js
  var require_Face = __commonJS({
    "dxf-writer@1.18.4/src/Face.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Face = class extends DatabaseObject {
        constructor(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
          super(["AcDbEntity", "AcDbFace"]);
          this.x1 = x1;
          this.y1 = y1;
          this.z1 = z1;
          this.x2 = x2;
          this.y2 = y2;
          this.z2 = z2;
          this.x3 = x3;
          this.y3 = y3;
          this.z3 = z3;
          this.x4 = x4;
          this.y4 = y4;
          this.z4 = z4;
        }
        tags(manager) {
          manager.push(0, "3DFACE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x1, this.y1, this.z1);
          manager.push(11, this.x2);
          manager.push(21, this.y2);
          manager.push(31, this.z2);
          manager.push(12, this.x3);
          manager.push(22, this.y3);
          manager.push(32, this.z3);
          manager.push(13, this.x4);
          manager.push(23, this.y4);
          manager.push(33, this.z4);
        }
      };
      module.exports = Face;
    }
  });

  // dxf-writer@1.18.4/src/Point.js
  var require_Point = __commonJS({
    "dxf-writer@1.18.4/src/Point.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Point = class extends DatabaseObject {
        constructor(x, y) {
          super(["AcDbEntity", "AcDbPoint"]);
          this.x = x;
          this.y = y;
        }
        tags(manager) {
          manager.push(0, "POINT");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y);
        }
      };
      module.exports = Point;
    }
  });

  // dxf-writer@1.18.4/src/Spline.js
  var require_Spline = __commonJS({
    "dxf-writer@1.18.4/src/Spline.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Spline = class extends DatabaseObject {
        /**
         * Creates a spline. See https://www.autodesk.com/techpubs/autocad/acad2000/dxf/spline_dxf_06.htm
         * @param {[Array]} controlPoints - Array of control points like [ [x1, y1], [x2, y2]... ]
         * @param {number} degree - Degree of spline: 2 for quadratic, 3 for cubic. Default is 3
         * @param {[number]} knots - Knot vector array. If null, will use a uniform knot vector. Default is null
         * @param {[number]} weights - Control point weights. If provided, must be one weight for each control point. Default is null
         * @param {[Array]} fitPoints - Array of fit points like [ [x1, y1], [x2, y2]... ]
         */
        constructor(controlPoints, degree = 3, knots = null, weights = null, fitPoints = []) {
          super(["AcDbEntity", "AcDbSpline"]);
          if (controlPoints.length < degree + 1) {
            throw new Error(
              `For degree ${degree} spline, expected at least ${degree + 1} control points, but received only ${controlPoints.length}`
            );
          }
          if (knots == null) {
            knots = [];
            for (let i = 0; i < degree + 1; i++) {
              knots.push(0);
            }
            for (let i = 1; i < controlPoints.length - degree; i++) {
              knots.push(i);
            }
            for (let i = 0; i < degree + 1; i++) {
              knots.push(controlPoints.length - degree);
            }
          }
          if (knots.length !== controlPoints.length + degree + 1) {
            throw new Error(
              `Invalid knot vector length. Expected ${controlPoints.length + degree + 1} but received ${knots.length}.`
            );
          }
          this.controlPoints = controlPoints;
          this.knots = knots;
          this.fitPoints = fitPoints;
          this.degree = degree;
          this.weights = weights;
          const closed = 0;
          const periodic = 0;
          const rational = this.weights ? 1 : 0;
          const planar = 1;
          const linear = 0;
          this.type = closed * 1 + periodic * 2 + rational * 4 + planar * 8 + linear * 16;
        }
        tags(manager) {
          manager.push(0, "SPLINE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.push(210, 0);
          manager.push(220, 0);
          manager.push(230, 1);
          manager.push(70, this.type);
          manager.push(71, this.degree);
          manager.push(72, this.knots.length);
          manager.push(73, this.controlPoints.length);
          manager.push(74, this.fitPoints.length);
          manager.push(42, 1e-7);
          manager.push(43, 1e-7);
          manager.push(44, 1e-10);
          this.knots.forEach((knot) => {
            manager.push(40, knot);
          });
          if (this.weights) {
            this.weights.forEach((weight) => {
              manager.push(41, weight);
            });
          }
          this.controlPoints.forEach((point) => {
            manager.point(point[0], point[1]);
          });
        }
      };
      module.exports = Spline;
    }
  });

  // dxf-writer@1.18.4/src/Ellipse.js
  var require_Ellipse = __commonJS({
    "dxf-writer@1.18.4/src/Ellipse.js"(exports, module) {
      var DatabaseObject = require_DatabaseObject();
      var Ellipse = class extends DatabaseObject {
        /**
         * Creates an ellipse.
         * @param {number} x - Center x
         * @param {number} y - Center y
         * @param {number} majorAxisX - Endpoint x of major axis, relative to center
         * @param {number} majorAxisY - Endpoint y of major axis, relative to center
         * @param {number} axisRatio - Ratio of minor axis to major axis
         * @param {number} startAngle - Start angle
         * @param {number} endAngle - End angle
         */
        constructor(x, y, majorAxisX, majorAxisY, axisRatio, startAngle, endAngle) {
          super(["AcDbEntity", "AcDbEllipse"]);
          this.x = x;
          this.y = y;
          this.majorAxisX = majorAxisX;
          this.majorAxisY = majorAxisY;
          this.axisRatio = axisRatio;
          this.startAngle = startAngle;
          this.endAngle = endAngle;
        }
        tags(manager) {
          manager.push(0, "ELLIPSE");
          super.tags(manager);
          manager.push(8, this.layer.name);
          manager.point(this.x, this.y);
          manager.push(11, this.majorAxisX);
          manager.push(21, this.majorAxisY);
          manager.push(31, 0);
          manager.push(40, this.axisRatio);
          manager.push(41, this.startAngle);
          manager.push(42, this.endAngle);
        }
      };
      module.exports = Ellipse;
    }
  });

  // dxf-writer@1.18.4/src/TagsManager.js
  var require_TagsManager = __commonJS({
    "dxf-writer@1.18.4/src/TagsManager.js"(exports, module) {
      var TagsManager = class {
        constructor() {
          this.lines = [];
        }
        /**
         *
         * @param {number} x
         * @param {number} y
         * @param {number} z
         */
        point(x, y, z = 0) {
          this.push(10, x);
          this.push(20, y);
          this.push(30, z);
        }
        /**
         *
         * @param {string} name The name of the section
         */
        start(name) {
          this.push(0, "SECTION");
          this.push(2, name);
        }
        end() {
          this.push(0, "ENDSEC");
        }
        addHeaderVariable(name, tagsElements) {
          this.push(9, `$${name}`);
          tagsElements.forEach((tagElement) => {
            this.push(tagElement[0], tagElement[1]);
          });
        }
        push(code, value) {
          this.lines.push(code, value);
        }
        toDxfString() {
          return this.lines.join("\n");
        }
      };
      module.exports = TagsManager;
    }
  });

  // dxf-writer@1.18.4/src/Drawing.js
  var require_Drawing = __commonJS({
    "dxf-writer@1.18.4/src/Drawing.js"(exports, module) {
      var LineType = require_LineType();
      var Layer = require_Layer();
      var Table = require_Table();
      var DimStyleTable = require_DimStyleTable();
      var TextStyle = require_TextStyle();
      var Viewport = require_Viewport();
      var AppId = require_AppId();
      var Block = require_Block();
      var BlockRecord = require_BlockRecord();
      var Dictionary = require_Dictionary();
      var Line = require_Line();
      var Line3d = require_Line3d();
      var Arc = require_Arc();
      var Circle = require_Circle();
      var Cylinder = require_Cylinder();
      var Text = require_Text();
      var Polyline = require_Polyline();
      var Polyline3d = require_Polyline3d();
      var Face = require_Face();
      var Point = require_Point();
      var Spline = require_Spline();
      var Ellipse = require_Ellipse();
      var TagsManager = require_TagsManager();
      var Handle = require_Handle();
      var Drawing2 = class _Drawing {
        constructor() {
          this.layers = {};
          this.activeLayer = null;
          this.lineTypes = {};
          this.headers = {};
          this.tables = {};
          this.blocks = {};
          this.dictionary = new Dictionary();
          this.setUnits("Unitless");
          for (const ltype of _Drawing.LINE_TYPES) {
            this.addLineType(ltype.name, ltype.description, ltype.elements);
          }
          for (const l of _Drawing.LAYERS) {
            this.addLayer(l.name, l.colorNumber, l.lineTypeName);
          }
          this.setActiveLayer("0");
          this.generateAutocadExtras();
        }
        /**
         * @param {string} name
         * @param {string} description
         * @param {array} elements - if elem > 0 it is a line, if elem < 0 it is gap, if elem == 0.0 it is a
         */
        addLineType(name, description, elements) {
          this.lineTypes[name] = new LineType(name, description, elements);
          return this;
        }
        addLayer(name, colorNumber, lineTypeName) {
          this.layers[name] = new Layer(name, colorNumber, lineTypeName);
          return this;
        }
        setActiveLayer(name) {
          this.activeLayer = this.layers[name];
          return this;
        }
        addTable(name) {
          const table = new Table(name);
          this.tables[name] = table;
          return table;
        }
        /**
         *
         * @param {string} name The name of the block.
         * @returns {Block}
         */
        addBlock(name) {
          const block = new Block(name);
          this.blocks[name] = block;
          return block;
        }
        drawLine(x1, y1, x2, y2) {
          this.activeLayer.addShape(new Line(x1, y1, x2, y2));
          return this;
        }
        drawLine3d(x1, y1, z1, x2, y2, z2) {
          this.activeLayer.addShape(new Line3d(x1, y1, z1, x2, y2, z2));
          return this;
        }
        drawPoint(x, y) {
          this.activeLayer.addShape(new Point(x, y));
          return this;
        }
        drawRect(x1, y1, x2, y2, cornerLength, cornerBulge) {
          const w = x2 - x1;
          const h = y2 - y1;
          cornerBulge = cornerBulge || 0;
          let p = null;
          if (!cornerLength) {
            p = new Polyline(
              [
                [x1, y1],
                [x1, y1 + h],
                [x1 + w, y1 + h],
                [x1 + w, y1]
              ],
              true
            );
          } else {
            p = new Polyline(
              [
                [x1 + w - cornerLength, y1, cornerBulge],
                // 1
                [x1 + w, y1 + cornerLength],
                // 2
                [x1 + w, y1 + h - cornerLength, cornerBulge],
                // 3
                [x1 + w - cornerLength, y1 + h],
                // 4
                [x1 + cornerLength, y1 + h, cornerBulge],
                // 5
                [x1, y1 + h - cornerLength],
                // 6
                [x1, y1 + cornerLength, cornerBulge],
                // 7
                [x1 + cornerLength, y1]
                // 8
              ],
              true
            );
          }
          this.activeLayer.addShape(p);
          return this;
        }
        /**
         * Draw a regular convex polygon as a polyline entity.
         *
         * @see [Regular polygon | Wikipedia](https://en.wikipedia.org/wiki/Regular_polygon)
         *
         * @param {number} x - The X coordinate of the center of the polygon.
         * @param {number} y - The Y coordinate of the center of the polygon.
         * @param {number} numberOfSides - The number of sides.
         * @param {number} radius - The radius.
         * @param {number} rotation - The  rotation angle (in Degrees) of the polygon. By default 0.
         * @param {boolean} circumscribed - If `true` is a polygon in which each side is a tangent to a circle.
         * If `false` is a polygon in which all vertices lie on a circle. By default `false`.
         *
         * @returns {Drawing} - The current object of {@link Drawing}.
         */
        drawPolygon(x, y, numberOfSides, radius, rotation = 0, circumscribed = false) {
          const angle = 2 * Math.PI / numberOfSides;
          const vertices = [];
          let d = radius;
          const rotationRad = rotation * Math.PI / 180;
          if (circumscribed) d = radius / Math.cos(Math.PI / numberOfSides);
          for (let i = 0; i < numberOfSides; i++) {
            vertices.push([
              x + d * Math.sin(rotationRad + i * angle),
              y + d * Math.cos(rotationRad + i * angle)
            ]);
          }
          this.activeLayer.addShape(new Polyline(vertices, true));
          return this;
        }
        /**
         * @param {number} x1 - Center x
         * @param {number} y1 - Center y
         * @param {number} r - radius
         * @param {number} startAngle - degree
         * @param {number} endAngle - degree
         */
        drawArc(x1, y1, r, startAngle, endAngle) {
          this.activeLayer.addShape(new Arc(x1, y1, r, startAngle, endAngle));
          return this;
        }
        /**
         * @param {number} x1 - Center x
         * @param {number} y1 - Center y
         * @param {number} r - radius
         */
        drawCircle(x1, y1, r) {
          this.activeLayer.addShape(new Circle(x1, y1, r));
          return this;
        }
        /**
         * @param {number} x1 - Center x
         * @param {number} y1 - Center y
         * @param {number} z1 - Center z
         * @param {number} r - radius
         * @param {number} thickness - thickness
         * @param {number} extrusionDirectionX - Extrusion Direction x
         * @param {number} extrusionDirectionY - Extrusion Direction y
         * @param {number} extrusionDirectionZ - Extrusion Direction z
         */
        drawCylinder(x1, y1, z1, r, thickness, extrusionDirectionX, extrusionDirectionY, extrusionDirectionZ) {
          this.activeLayer.addShape(
            new Cylinder(
              x1,
              y1,
              z1,
              r,
              thickness,
              extrusionDirectionX,
              extrusionDirectionY,
              extrusionDirectionZ
            )
          );
          return this;
        }
        /**
         * @param {number} x1 - x
         * @param {number} y1 - y
         * @param {number} height - Text height
         * @param {number} rotation - Text rotation
         * @param {string} value - the string itself
         * @param {string} [horizontalAlignment="left"] left | center | right
         * @param {string} [verticalAlignment="baseline"] baseline | bottom | middle | top
         */
        drawText(x1, y1, height, rotation, value, horizontalAlignment = "left", verticalAlignment = "baseline") {
          this.activeLayer.addShape(
            new Text(
              x1,
              y1,
              height,
              rotation,
              value,
              horizontalAlignment,
              verticalAlignment
            )
          );
          return this;
        }
        /**
         * @param {[number, number][]} points - Array of points like [ [x1, y1], [x2, y2]... ]
         * @param {boolean} closed - Closed polyline flag
         * @param {number} startWidth - Default start width
         * @param {number} endWidth - Default end width
         */
        drawPolyline(points, closed = false, startWidth = 0, endWidth = 0) {
          this.activeLayer.addShape(
            new Polyline(points, closed, startWidth, endWidth)
          );
          return this;
        }
        /**
         * @param {[number, number, number][]} points - Array of points like [ [x1, y1, z1], [x2, y2, z1]... ]
         */
        drawPolyline3d(points) {
          points.forEach((point) => {
            if (point.length !== 3) {
              throw "Require 3D coordinates";
            }
          });
          this.activeLayer.addShape(new Polyline3d(points));
          return this;
        }
        /**
         *
         * @param {number} trueColor - Integer representing the true color, can be passed as an hexadecimal value of the form 0xRRGGBB
         */
        setTrueColor(trueColor) {
          this.activeLayer.setTrueColor(trueColor);
          return this;
        }
        /**
         * Draw a spline.
         * @param {[Array]} controlPoints - Array of control points like [ [x1, y1], [x2, y2]... ]
         * @param {number} degree - Degree of spline: 2 for quadratic, 3 for cubic. Default is 3
         * @param {[number]} knots - Knot vector array. If null, will use a uniform knot vector. Default is null
         * @param {[number]} weights - Control point weights. If provided, must be one weight for each control point. Default is null
         * @param {[Array]} fitPoints - Array of fit points like [ [x1, y1], [x2, y2]... ]
         */
        drawSpline(controlPoints, degree = 3, knots = null, weights = null, fitPoints = []) {
          this.activeLayer.addShape(
            new Spline(controlPoints, degree, knots, weights, fitPoints)
          );
          return this;
        }
        /**
         * Draw an ellipse.
         * @param {number} x1 - Center x
         * @param {number} y1 - Center y
         * @param {number} majorAxisX - Endpoint x of major axis, relative to center
         * @param {number} majorAxisY - Endpoint y of major axis, relative to center
         * @param {number} axisRatio - Ratio of minor axis to major axis
         * @param {number} startAngle - Start angle
         * @param {number} endAngle - End angle
         */
        drawEllipse(x1, y1, majorAxisX, majorAxisY, axisRatio, startAngle = 0, endAngle = 2 * Math.PI) {
          this.activeLayer.addShape(
            new Ellipse(
              x1,
              y1,
              majorAxisX,
              majorAxisY,
              axisRatio,
              startAngle,
              endAngle
            )
          );
          return this;
        }
        /**
         * @param {number} x1 - x
         * @param {number} y1 - y
         * @param {number} z1 - z
         * @param {number} x2 - x
         * @param {number} y2 - y
         * @param {number} z2 - z
         * @param {number} x3 - x
         * @param {number} y3 - y
         * @param {number} z3 - z
         * @param {number} x4 - x
         * @param {number} y4 - y
         * @param {number} z4 - z
         */
        drawFace(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
          this.activeLayer.addShape(
            new Face(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4)
          );
          return this;
        }
        _ltypeTable() {
          const t = new Table("LTYPE");
          const ltypes = Object.values(this.lineTypes);
          for (const lt of ltypes) t.add(lt);
          return t;
        }
        _layerTable(manager) {
          const t = new Table("LAYER");
          const layers = Object.values(this.layers);
          for (const l of layers) t.add(l);
          return t;
        }
        /**
         * @see https://www.autodesk.com/techpubs/autocad/acadr14/dxf/header_section_al_u05_c.htm
         * @see https://www.autodesk.com/techpubs/autocad/acad2000/dxf/header_section_group_codes_dxf_02.htm
         *
         * @param {string} variable
         * @param {array} values Array of "two elements arrays". [  [value1_GroupCode, value1_value], [value2_GroupCode, value2_value]  ]
         */
        header(variable, values) {
          this.headers[variable] = values;
          return this;
        }
        /**
         *
         * @param {string} unit see Drawing.UNITS
         */
        setUnits(unit) {
          let value = typeof _Drawing.UNITS[unit] != "undefined" ? _Drawing.UNITS[unit] : _Drawing.UNITS["Unitless"];
          this.header("INSUNITS", [[70, _Drawing.UNITS[unit]]]);
          return this;
        }
        /** Generate additional DXF metadata which are required to successfully open resulted document
         * in AutoDesk products. Call this method before serializing the drawing to get the most
         * compatible result.
         */
        generateAutocadExtras() {
          if (!this.headers["ACADVER"]) {
            this.header("ACADVER", [[1, "AC1021"]]);
          }
          if (!this.lineTypes["ByBlock"]) {
            this.addLineType("ByBlock", "", []);
          }
          if (!this.lineTypes["ByLayer"]) {
            this.addLineType("ByLayer", "", []);
          }
          let vpTable = this.tables["VPORT"];
          if (!vpTable) {
            vpTable = this.addTable("VPORT");
          }
          let styleTable = this.tables["STYLE"];
          if (!styleTable) {
            styleTable = this.addTable("STYLE");
          }
          if (!this.tables["VIEW"]) {
            this.addTable("VIEW");
          }
          if (!this.tables["UCS"]) {
            this.addTable("UCS");
          }
          let appIdTable = this.tables["APPID"];
          if (!appIdTable) {
            appIdTable = this.addTable("APPID");
          }
          if (!this.tables["DIMSTYLE"]) {
            const t = new DimStyleTable("DIMSTYLE");
            this.tables["DIMSTYLE"] = t;
          }
          vpTable.add(new Viewport("*ACTIVE", 1e3));
          styleTable.add(new TextStyle("standard"));
          appIdTable.add(new AppId("ACAD"));
          this.modelSpace = this.addBlock("*Model_Space");
          this.addBlock("*Paper_Space");
          const d = new Dictionary();
          this.dictionary.addChildDictionary("ACAD_GROUP", d);
        }
        _tagsManager() {
          const manager = new TagsManager();
          const blockRecordTable = new Table("BLOCK_RECORD");
          const blocks = Object.values(this.blocks);
          for (const b of blocks) {
            const r = new BlockRecord(b.name);
            blockRecordTable.add(r);
          }
          const ltypeTable = this._ltypeTable();
          const layerTable = this._layerTable();
          manager.start("HEADER");
          manager.addHeaderVariable("HANDSEED", [[5, Handle.peek()]]);
          const variables = Object.entries(this.headers);
          for (const v of variables) {
            const [name, values] = v;
            manager.addHeaderVariable(name, values);
          }
          manager.end();
          manager.start("CLASSES");
          manager.end();
          manager.start("TABLES");
          ltypeTable.tags(manager);
          layerTable.tags(manager);
          const tables = Object.values(this.tables);
          for (const t of tables) {
            t.tags(manager);
          }
          blockRecordTable.tags(manager);
          manager.end();
          manager.start("BLOCKS");
          for (const b of blocks) {
            b.tags(manager);
          }
          manager.end();
          manager.start("ENTITIES");
          const layers = Object.values(this.layers);
          for (const l of layers) {
            l.shapesTags(this.modelSpace, manager);
          }
          manager.end();
          manager.start("OBJECTS");
          this.dictionary.tags(manager);
          manager.end();
          manager.push(0, "EOF");
          return manager;
        }
        toDxfString() {
          return this._tagsManager().toDxfString();
        }
      };
      Drawing2.ACI = {
        LAYER: 0,
        RED: 1,
        YELLOW: 2,
        GREEN: 3,
        CYAN: 4,
        BLUE: 5,
        MAGENTA: 6,
        WHITE: 7
      };
      Drawing2.LINE_TYPES = [
        { name: "CONTINUOUS", description: "______", elements: [] },
        { name: "DASHED", description: "_ _ _ ", elements: [5, -5] },
        { name: "DOTTED", description: ". . . ", elements: [0, -5] }
      ];
      Drawing2.LAYERS = [
        { name: "0", colorNumber: Drawing2.ACI.WHITE, lineTypeName: "CONTINUOUS" }
      ];
      Drawing2.UNITS = {
        Unitless: 0,
        Inches: 1,
        Feet: 2,
        Miles: 3,
        Millimeters: 4,
        Centimeters: 5,
        Meters: 6,
        Kilometers: 7,
        Microinches: 8,
        Mils: 9,
        Yards: 10,
        Angstroms: 11,
        Nanometers: 12,
        Microns: 13,
        Decimeters: 14,
        Decameters: 15,
        Hectometers: 16,
        Gigameters: 17,
        "Astronomical units": 18,
        "Light years": 19,
        Parsecs: 20
      };
      module.exports = Drawing2;
    }
  });

  // dxf-writer@1.18.4/index.js
  var require_dxf_writer = __commonJS({
    "dxf-writer@1.18.4/index.js"(exports, module) {
      module.exports = require_Drawing();
    }
  });

  // openPlan3D/src/lib/utils/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    Drawing: () => import_dxf_writer.default,
    cadText: () => cadText,
    canvasSymbolDxf: () => canvasSymbolDxf
  });
  var import_dxf_writer = __toESM(require_dxf_writer());

  // openPlan3D/src/lib/utils/canvasSymbolDxf.ts
  function canvasSymbolDxf(drawing, draw) {
    let matrix = [1, 0, 0, 1, 0, 0], rotation = 0;
    const stack = [];
    const world = ([x, y]) => [matrix[0] * x + matrix[2] * y + matrix[4], -(matrix[1] * x + matrix[3] * y + matrix[5])];
    let paths = [];
    const emitted = /* @__PURE__ */ new Set();
    const emit = (segment) => {
      const points = segment.points.map(world), key = JSON.stringify([points, segment.weights]);
      if (emitted.has(key)) return;
      emitted.add(key);
      if (points.length === 2) drawing.drawLine(...points[0], ...points[1]);
      else drawing.drawSpline(points, points.length - 1, void 0, segment.weights);
    };
    const context = {
      fillStyle: "#000",
      strokeStyle: "#000",
      lineWidth: 1,
      font: "10px sans-serif",
      textAlign: "start",
      textBaseline: "alphabetic",
      save() {
        stack.push({ matrix: [...matrix], rotation, styles: Object.fromEntries(Object.entries(this).filter(([, v]) => typeof v !== "function")) });
      },
      restore() {
        const state = stack.pop();
        if (state) {
          matrix = state.matrix;
          rotation = state.rotation;
          Object.assign(this, state.styles);
        }
      },
      translate(x, y) {
        matrix[4] += matrix[0] * x + matrix[2] * y;
        matrix[5] += matrix[1] * x + matrix[3] * y;
      },
      rotate(angle) {
        const [a, b, c, d] = matrix, cos = Math.cos(angle), sin = Math.sin(angle);
        matrix[0] = a * cos + c * sin;
        matrix[1] = b * cos + d * sin;
        matrix[2] = c * cos - a * sin;
        matrix[3] = d * cos - b * sin;
        rotation += angle * 180 / Math.PI;
      },
      scale(x, y) {
        matrix[0] *= x;
        matrix[1] *= x;
        matrix[2] *= y;
        matrix[3] *= y;
      },
      beginPath() {
        paths = [];
      },
      moveTo(x, y) {
        paths.push({ start: [x, y], end: [x, y], segments: [] });
      },
      lineTo(x, y) {
        const p = paths.at(-1);
        if (!p) {
          this.moveTo(x, y);
          return;
        }
        p.segments.push({ points: [p.end, [x, y]] });
        p.end = [x, y];
      },
      quadraticCurveTo(cx, cy, x, y) {
        const p = paths.at(-1);
        p.segments.push({ points: [p.end, [cx, cy], [x, y]] });
        p.end = [x, y];
      },
      bezierCurveTo(x1, y1, x2, y2, x, y) {
        const p = paths.at(-1);
        p.segments.push({ points: [p.end, [x1, y1], [x2, y2], [x, y]] });
        p.end = [x, y];
      },
      closePath() {
        const p = paths.at(-1);
        if (p) this.lineTo(...p.start);
      },
      stroke() {
        for (const p of paths) for (const segment of p.segments) emit(segment);
      },
      fill() {
        this.stroke();
        for (const p of paths) if (p.end[0] !== p.start[0] || p.end[1] !== p.start[1]) emit({ points: [p.end, p.start] });
      },
      fillRect(x, y, w, h) {
        const p = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
        for (let i = 1; i < p.length; i++) emit({ points: [p[i - 1], p[i]] });
      },
      strokeRect(x, y, w, h) {
        this.fillRect(x, y, w, h);
      },
      fillText(text, x, y) {
        const p = world([x, y]), height = Number(this.font.match(/([\d.]+)px/)?.[1] ?? 10);
        drawing.drawText(p[0], p[1], height, -rotation, text, this.textAlign === "center" ? "center" : this.textAlign === "right" ? "right" : "left", this.textBaseline === "middle" ? "middle" : "baseline");
      },
      arc(x, y, r, start, end, ccw = false) {
        this.ellipse(x, y, r, r, 0, start, end, ccw);
      },
      ellipse(x, y, rx, ry, rotation2, start, end, ccw = false) {
        const tau = 2 * Math.PI;
        let sweep = end - start;
        if (!ccw && sweep >= tau) sweep = tau;
        else if (ccw && sweep <= -tau) sweep = -tau;
        else if (ccw) {
          sweep %= tau;
          if (sweep > 0) sweep -= tau;
        } else {
          sweep %= tau;
          if (sweep < 0) sweep += tau;
        }
        const point = (a, weight = 1) => [x + (rx * Math.cos(a) * Math.cos(rotation2) - ry * Math.sin(a) * Math.sin(rotation2)) / weight, y + (rx * Math.cos(a) * Math.sin(rotation2) + ry * Math.sin(a) * Math.cos(rotation2)) / weight];
        this.lineTo(...point(start));
        const count = Math.ceil(Math.abs(sweep) / (Math.PI / 2));
        for (let i = 0; i < count; i++) {
          const a = start + sweep * i / count, b = start + sweep * (i + 1) / count, w = Math.cos((b - a) / 2), p = paths.at(-1);
          const endPoint = point(b);
          p.segments.push({ points: [p.end, point((a + b) / 2, w), endPoint], weights: [1, w, 1] });
          p.end = endPoint;
        }
      }
    };
    const adapter = new Proxy(context, { get(target, key, receiver) {
      if (!(key in target)) throw new Error(`Unsupported symbol DXF command: ${String(key)}`);
      return Reflect.get(target, key, receiver);
    } });
    draw(adapter);
  }

  // openPlan3D/src/lib/utils/exportText.ts
  function cadText(s) {
    return s.replace(/[\t\n\v\f\r\u0085\u2028\u2029]+/g, " ").replace(/\p{Cc}/gu, "");
  }
  return __toCommonJS(entry_exports);
})();
if (typeof module === 'object' && module.exports) module.exports = RubikDxfTools;
