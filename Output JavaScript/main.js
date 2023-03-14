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
exports.shortNameGenerator = exports.getLongLat = exports.searchData = exports.jsonGenerator = exports.commonBuildingInfo = exports.parseRoomData = exports.stringList2jsonList = void 0;
const fs = __importStar(require("fs-extra"));
const parse5 = __importStar(require("parse5"));
const http = __importStar(require("http"));
function stringList2jsonList(id, htmlArray) {
    const jsonList = [];
    let promises = [];
    for (let theHtml of htmlArray) {
        promises.push(parseRoomData(id, theHtml));
    }
    return Promise.all(promises)
        .then((buildingsList) => {
        for (let building of buildingsList) {
            for (let room of building) {
                jsonList.push(room);
            }
        }
        return jsonList;
    })
        .catch((error) => {
        return Promise.reject(error);
    });
}
exports.stringList2jsonList = stringList2jsonList;
function parseRoomData(id, htmlData) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = [];
        let theDocument = parse5.parse(htmlData);
        let tables = findAllTables(theDocument);
        let filteredTable = [];
        for (let table of tables) {
            if (table.childNodes[1].childNodes[1].childNodes[1].attrs[0].value ===
                "views-field views-field-field-room-number" &&
                table.childNodes[1].childNodes[1].childNodes[3].attrs[0].value ===
                    "views-field views-field-field-room-capacity" &&
                table.childNodes[1].childNodes[1].childNodes[5].attrs[0].value ===
                    "views-field views-field-field-room-furniture" &&
                table.childNodes[1].childNodes[1].childNodes[7].attrs[0].value ===
                    "views-field views-field-field-room-type" &&
                table.childNodes[1].childNodes[1].childNodes[9].attrs[0].value === "views-field views-field-nothing") {
                filteredTable.push(table);
            }
        }
        if (filteredTable.length > 0) {
            let { fullBuildingName, roomAddress, roomLatitude, roomLongitude, numberOfRooms } = yield commonBuildingInfo(theDocument);
            if (roomLatitude === undefined || roomLongitude === undefined) {
                return result;
            }
            jsonGenerator(numberOfRooms, filteredTable[0], id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result);
        }
        return result;
    });
}
exports.parseRoomData = parseRoomData;
function commonBuildingInfo(theDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        let fullBuildingName = searchData(theDocument, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value.trim();
        let numberOfRooms = Math.floor(searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2);
        let roomAddress = searchData(theDocument, "id", "building-info").childNodes[3].childNodes[0].childNodes[0].value.trim();
        let addressLongLat = yield getLongLat(roomAddress);
        let roomLatitude = addressLongLat.lat;
        let roomLongitude = addressLongLat.lon;
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
function getRoomInfoList(theTable, numberOfRooms) {
    let insideTable = theTable.childNodes[3];
    let roomNumberList = [];
    let roomSeatsList = [];
    let roomFurnitureList = [];
    let roomTypesList = [];
    let roomHrefList = [];
    for (let i = 1; i < numberOfRooms * 2; i += 2) {
        roomNumberList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-number").childNodes[1].childNodes[0].value.trim());
        roomSeatsList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-capacity").childNodes[0].value.trim());
        roomFurnitureList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-furniture").childNodes[0].value.trim());
        roomTypesList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-type").childNodes[0].value.trim());
        roomHrefList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-nothing").childNodes[1].attrs[0].value.trim());
    }
    return { roomNumberList, roomSeatsList, roomFurnitureList: roomFurnitureList, roomTypesList, roomHrefList };
}
function jsonGenerator(numberOfRooms, theTable, id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result) {
    let { roomNumberList, roomSeatsList, roomFurnitureList, roomTypesList, roomHrefList } = getRoomInfoList(theTable, numberOfRooms);
    for (let i = 1; i <= numberOfRooms; i++) {
        let roomNumber = roomNumberList[i - 1];
        let roomSeats = roomSeatsList[i - 1];
        let roomFurniture = roomFurnitureList[i - 1];
        let roomType = roomTypesList[i - 1];
        let roomHref = roomHrefList[i - 1];
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
function findAllTables(document) {
    const tables = [];
    function findTables(node) {
        if (node.nodeName === "table") {
            tables.push(node);
        }
        else if (node.childNodes) {
            let theLength = node.childNodes.length;
            for (let i = 0; i < theLength; i++) {
                findTables(node.childNodes[i]);
            }
        }
    }
    findTables(document);
    return tables;
}
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
    return roomNameArray[0];
}
exports.shortNameGenerator = shortNameGenerator;
let DMPstring = fs.readFileSync("DMP.htm", "utf8");
let BRKXstring = fs.readFileSync("BRKX.htm", "utf8");
let ICCSstring = fs.readFileSync("ICCS.htm", "utf8");
let buildingList = [];
buildingList.push(DMPstring);
buildingList.push(BRKXstring);
buildingList.push(ICCSstring);
stringList2jsonList("Harvard", buildingList).then((a) => {
    console.log(a);
});
