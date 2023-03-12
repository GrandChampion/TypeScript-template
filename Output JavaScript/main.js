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
exports.getShortName = exports.getLongLat = exports.searchData = exports.parseRoomData = exports.stringList2jsonList = void 0;
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
function parseRoomData(id, htmlData) {
    return __awaiter(this, void 0, void 0, function* () {
        let roomData = fs.readFileSync("DMP1.htm", "utf8");
        let result = [];
        let document1 = parse5.parse(roomData);
        let fullBuildingName = searchData(document1, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value.trim();
        let roomAddress = searchData(document1, "id", "building-info").childNodes[3].childNodes[0].childNodes[0].value.trim();
        let addressLongLat = yield getLongLat(roomAddress);
        let roomLatitude = addressLongLat.lat;
        let roomLongitude = addressLongLat.lon;
        let numberOfRooms = Math.floor(searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2);
        for (let i = 1; i <= numberOfRooms; i++) {
            let roomNumber = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
                .childNodes[1].childNodes[1].childNodes[0].value.trim();
            let roomSeats = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
                .childNodes[3].childNodes[0].value.trim();
            let roomFurniture = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
                .childNodes[5].childNodes[0].value.trim();
            let roomType = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
                .childNodes[7].childNodes[0].value.trim();
            let roomHref = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
                .childNodes[9].childNodes[1].attrs[0].value.trim();
            let roomJson = {
                [id + "_fullname"]: fullBuildingName,
                [id + "_shortname"]: getShortName(fullBuildingName),
                [id + "_number"]: roomNumber,
                [id + "_name"]: getShortName(fullBuildingName) + "_" + roomNumber,
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
        return result;
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
parseRoomData("DMP", "DMP.htm").then((a) => {
    console.log(a);
});
function getShortName(longBuildingName) {
    let LongShortMap = new Map([
        ["Acute Care Unit", "ACU"],
        ["Allard Hall (LAW)", "ALRD"],
        ["Anthropology and Sociology", "ANSO"],
        ["Aquatic Ecosystems Research Laboratory", "AERL"],
        ["Asian Centre", "ACEN"],
        ["Audain Art Centre", "AAC"],
        ["Auditorium", "AUDI"],
        ["Auditorium Annex", "AUDX"],
        ["B.C. Binnings Studio", "BINN"],
        ["Biological Sciences", "BIOL"],
        ["Brock Hall Annex", "BRKX"],
        ["Buchanan", "BUCH"],
        ["Buchanan Tower", "BUTO"],
        ["C. K. Choi Building for The Institute of Asian Res", "CHOI"],
        ["Centre for Interactive Research on Sustainability", "CIRS"],
        ["Chan Centre", "CHAN"],
        ["Chemical and Biological Engineering Building", "CHBE"],
        ["Chemistry", "CHEM"],
        ["Civil and Mechanical Engineering", "CEME"],
        ["D.H. Copp", "COPP"],
        ["David Lam Management Research Centre", "DLAM"],
        ["Detwiller Pavilion", "HSCC"],
        ["Dorothy Somerset Studio", "DSOM"],
        ["Douglas Kenny", "KENN"],
        ["Earth and Ocean Sciences - Main", "EOSM"],
        ["Earth Sciences Building", "ESB"],
        ["Food, Nutrition and Health", "FNH"],
        ["Forest Sciences Centre", "FSC"],
        ["Frank Forward", "FORW"],
        ["Fred Kaiser", "KAIS"],
        ["Frederic Lasserre", "LASR"],
        ["Frederic Wood Theatre", "FRWO"],
        ["Friedman Building", "FRDM"],
        ["Geography", "GEOG"],
        ["George Cunningham", "CUNN"],
        ["Hebb", "HEBB"],
        ["Hennings", "HENN"],
        ["Henry Angus", "ANGU"],
        ["Horticulture Building", "GREN"],
        ["Hugh Dempster Pavilion", "DMP"],
        ["Institute for Computing (ICICS/CS)", "ICCS"],
        ["Iona Building", "IONA"],
        ["Irving K Barber Learning Centre", "IBLC"],
        ["J.B. MacDonald", "MCDN"],
        ["Jack Bell Building for the School of Social Work", "SOWK"],
        ["Leonard S. Klinck (also known as CSCI)", "LSK"],
        ["Life Sciences Centre", "LSC"],
        ["MacLeod", "MCLD"],
        ["MacMillan", "MCML"],
        ["Mathematics", "MATH"],
        ["Mathematics Annex", "MATX"],
        ["Medical Sciences Block C", "MEDC"],
        ["Michael Smith Laboratories", "MSB"],
        ["Music", "MUSC"],
        ["Neville Scarfe", "SCRF"],
        ["Orchard Commons", "ORCH"],
        ["Pharmaceutical Sciences Building", "PHRM"],
        ["Ponderosa Annex E", "PONE"],
        ["Ponderosa Commons: Oak House", "PCOH"],
        ["Ponderosa Office Annex F", "PONF"],
        ["Ponderosa Office Annex H", "PONH"],
        ["Robert F. Osborne Centre", "OSBO"],
        ["School of Population and Public Health", "SPPH"],
        ["Sing Tao", "SOJ"],
        ["Student Recreation Centre", "SRC"],
        ["The Leon and Thea Koerner University Centre", "UCLL"],
        ["Theatre-Film Production Building", "TFPB"],
        ["Theatre-Film Production Building Annex", "TFPX"],
        ["War Memorial Gymnasium", "MGYM"],
        ["Wayne and William White Engineering Design Centre", "EDC"],
        ["Wesbrook", "WESB"],
        ["West Mall Annex", "WMAX"],
        ["West Mall Swing Space", "SWNG"],
        ["Woodward (Instructional Resources Centre-IRC)", "WOOD"],
    ]);
    return LongShortMap.get(longBuildingName);
}
exports.getShortName = getShortName;
