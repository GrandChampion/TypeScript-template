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
exports.getLongLat = exports.searchData = exports.parseRoomData = exports.commonBuildingInfo = exports.jsonGenerator = exports.stringList2jsonList = void 0;
const fs = __importStar(require("fs-extra"));
const parse5 = __importStar(require("parse5"));
const http = __importStar(require("http"));
function stringList2jsonList(id, htmlArray) {
    const jsonList = [];
    let promises = [];
    for (let html of htmlArray) {
        promises.push(parseRoomData(id, html));
    }
    Promise.all(promises).then((values) => {
        for (let value of values) {
            for (let json of value) {
                jsonList.push(json);
            }
        }
        return jsonList;
    });
}
exports.stringList2jsonList = stringList2jsonList;
function jsonGenerator(numberOfRooms, theDocument, id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result) {
    for (let i = 1; i <= numberOfRooms; i++) {
        let roomNumber = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[1].childNodes[1].childNodes[0].value.trim();
        let roomSeats = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[3].childNodes[0].value.trim();
        let roomFurniture = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[5].childNodes[0].value.trim();
        let roomType = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[7].childNodes[0].value.trim();
        let roomHref = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1].childNodes[9].childNodes[1].attrs[0].value.trim();
        let shortBuildingName = shortNameGenerator(roomHref);
        let roomJson = {
            [id + "_fullname"]: fullBuildingName,
            [id + "_shortname"]: shortBuildingName,
            [id + "_number"]: roomNumber,
            [id + "_name"]: shortBuildingName + "_" + roomNumber,
            [id + "_address"]: roomAddress,
            [id + "_lat"]: roomLatitude,
            [id + "_lon"]: roomLongitude,
            [id + "_seats"]: roomSeats,
            [id + "_type"]: roomType,
            [id + "_furniture"]: roomFurniture,
            [id + "_href"]: roomHref,
        };
        result.push(roomJson);
    }
}
exports.jsonGenerator = jsonGenerator;
function commonBuildingInfo(theDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        let fullBuildingName = searchData(theDocument, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value.trim();
        let roomAddress = searchData(theDocument, "id", "building-info").childNodes[3].childNodes[0].childNodes[0].value.trim();
        let addressLongLat = yield getLongLat(roomAddress);
        let roomLatitude = addressLongLat.lat;
        let roomLongitude = addressLongLat.lon;
        let numberOfRooms = Math.floor(searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2);
        return {
            fullBuildingName,
            roomAddress,
            roomLatitude,
            roomLongitude,
            numberOfRooms,
        };
    });
}
exports.commonBuildingInfo = commonBuildingInfo;
function parseRoomData(id, htmlData) {
    return __awaiter(this, void 0, void 0, function* () {
        let roomData = fs.readFileSync("DMP1.htm", "utf8");
        let result = [];
        let theDocument = parse5.parse(roomData);
        let { fullBuildingName, roomAddress, roomLatitude, roomLongitude, numberOfRooms } = yield commonBuildingInfo(theDocument);
        jsonGenerator(numberOfRooms, theDocument, id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result);
        return result;
    });
}
exports.parseRoomData = parseRoomData;
function searchData(htmlNode, attributeType, attributeValue) {
    if (htmlNode.attrs) {
        if (htmlNode.attrs.find(function (res) {
            return res.name === attributeType && res.value === attributeValue;
        })) {
            return htmlNode;
        }
    }
    if (htmlNode.childNodes) {
        for (let childNode of htmlNode.childNodes) {
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
    return new Promise((resolve) => {
        let formattedAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team088/" + address.replace(/ /g, "%20");
        http.get(formattedAddress, function (received) {
            received.on("data", (requestedData) => {
                let JsonString = "" + requestedData;
                let longlatJson = JSON.parse(JsonString);
                resolve(longlatJson);
            });
        });
    });
}
exports.getLongLat = getLongLat;
function shortNameGenerator(url) {
    let nodeArray = url.split("/");
    let roomNameArray = nodeArray[nodeArray.length - 1].split("-");
    let shortBuildingName = roomNameArray[0];
    return shortBuildingName;
}
parseRoomData("DMP", "DMP.htm").then((a) => {
    console.log(a);
});
