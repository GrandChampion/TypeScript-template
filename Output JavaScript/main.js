"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRoomData = void 0;
const fs = __importStar(require("fs-extra"));
const parse5 = __importStar(require("parse5"));
function parseRoomData(id, htmlData) {
    let roomData = fs.readFileSync("DMP1.htm", "utf8");
    const document1 = parse5.parse(roomData);
    let fullBuildingName = findId(document1, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value;
    let roomNumbers = findId(document1, "class", "views-field views-field-field-room-furniture").value;
    console.log(roomNumbers);
    let roomJson = {
        [id + "_fullname"]: fullBuildingName,
        [id + "_shortname"]: String,
        [id + "_number"]: String,
        [id + "_name"]: String,
        [id + "_address"]: String,
        [id + "_lat"]: Number,
        [id + "_lon"]: Number,
        [id + "_seats"]: Number,
        [id + "_type"]: String,
        [id + "_furniture"]: String,
        [id + "_href"]: String
    };
}
exports.parseRoomData = parseRoomData;
function findId(node, attributeType, attributeValue) {
    if (node.attrs && node.attrs.find((attr) => attr.name === attributeType && attr.value === attributeValue)) {
        return node;
    }
    else if (node.childNodes) {
        for (const childNode of node.childNodes) {
            const foundNode = findId(childNode, attributeType, attributeValue);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return undefined;
}
parseRoomData("DMP", "DMP.htm");
