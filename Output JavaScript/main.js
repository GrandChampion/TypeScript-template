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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLongLat = exports.searchData = exports.parseRoomData = void 0;
const fs = __importStar(require("fs-extra"));
const parse5 = __importStar(require("parse5"));
const http = __importStar(require("http"));
function parseRoomData(id, htmlData) {
    return __awaiter(this, void 0, void 0, function* () {
        let roomData = fs.readFileSync("DMP1.htm", "utf8");
        const document1 = parse5.parse(roomData);
        let fullBuildingName = searchData(document1, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value;
        let address = searchData(document1, "id", "building-info").childNodes[3].childNodes[1].childNodes[0].value;
        let addressLongLat = yield getLongLat(address);
        let lattitude = addressLongLat.lat;
        let longitude = addressLongLat.lon;
        console.log(lattitude);
        console.log(longitude);
        let numberOfRooms = Math.floor(searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2);
        let i = 2;
        let roomNumbers = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[1].childNodes[1].childNodes[0].value;
        let roomSeats = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[3].childNodes[0].value;
        let roomFurniture = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[5].childNodes[0].value;
        let roomType = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[7].childNodes[0].value;
        let roomHref = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[9].childNodes[1].attrs[0].value;
        console.log(numberOfRooms);
        console.log(roomNumbers);
        console.log(roomSeats);
        console.log(roomFurniture);
        console.log(roomType);
        console.log(roomHref);
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
    });
}
exports.parseRoomData = parseRoomData;
function searchData(node, attributeType, attributeValue) {
    if (node.attrs) {
        if (node.attrs.find(function (res) {
            return res.name === attributeType && res.value === attributeValue;
        })) {
            return node;
        }
    }
    if (node.childNodes) {
        for (let childNode of node.childNodes) {
            let result = searchData(childNode, attributeType, attributeValue);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
}
exports.searchData = searchData;
function getLongLat(address) {
    return new Promise((resolve, reject) => {
        let formattedAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team088/" + address.replace(/ /g, "%20");
        http.get(formattedAddress, function (received) {
            received.on('data', (requestedData) => {
                let JsonString = "" + requestedData;
                let longlatJson = JSON.parse(JsonString);
                resolve(longlatJson);
            });
        });
    });
}
exports.getLongLat = getLongLat;
parseRoomData("DMP", "DMP.htm");
