import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as http from "http";
import {Document} from "parse5/dist/tree-adapters/default";

// This part is for mapping long building name to short building name
const LongShortMap = new Map<string, string>([
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

// Input: an array containing the html files as strings
// Output: an array containing the json files
export function stringList2jsonList(id: string, htmlArray: string[]) {
	const jsonList: any[] | PromiseLike<any[]> = [];
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

// Input: Building informations, which are common to all rooms in the building
// Output: no return value, but the function will write the json file
export function jsonGenerator(
	numberOfRooms: number,
	theDocument: Document,
	id: string,
	fullBuildingName: string,
	roomAddress: string,
	roomLatitude: any,
	roomLongitude: any,
	result: Array<{[p: string]: any}>
) {
	for (let i = 1; i <= numberOfRooms; i++) {
		// Getting information specific to each room
		let roomNumber = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[
			2 * i - 1
		].childNodes[1].childNodes[1].childNodes[0].value.trim();
		let roomSeats = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[
			2 * i - 1
		].childNodes[3].childNodes[0].value.trim();
		let roomFurniture = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[
			2 * i - 1
		].childNodes[5].childNodes[0].value.trim();
		let roomType = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[
			2 * i - 1
		].childNodes[7].childNodes[0].value.trim();
		let roomHref = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes[
			2 * i - 1
		].childNodes[9].childNodes[1].attrs[0].value.trim();

		let roomJson = {
			[id + "_fullname"]: fullBuildingName,
			[id + "_shortname"]: LongShortMap.get(fullBuildingName),
			[id + "_number"]: roomNumber,
			[id + "_name"]: LongShortMap.get(fullBuildingName) + "_" + roomNumber,
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

// Input: html file
// Output: an object containing common building information
export async function commonBuildingInfo(theDocument: Document) {
	let fullBuildingName: string = searchData(
		theDocument,
		"id",
		"building-info"
	).childNodes[1].childNodes[0].childNodes[0].value.trim();
	// let shortBuildingName
	let roomAddress = searchData(
		theDocument,
		"id",
		"building-info"
	).childNodes[3].childNodes[0].childNodes[0].value.trim();
	let addressLongLat = await getLongLat(roomAddress);
	let roomLatitude = addressLongLat.lat;
	let roomLongitude = addressLongLat.lon;

	let numberOfRooms = Math.floor(
		searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2
	);
	return {
		fullBuildingName,
		roomAddress,
		roomLatitude,
		roomLongitude,
		numberOfRooms,
	};
}

// Input: id of the Dataset, an html file which represents a building as a string
// Output: an array of json, each representing a room in the building
export async function parseRoomData(id: string, htmlData: string): Promise<Array<{[x: string]: any}>> {
	let roomData = fs.readFileSync("DMP1.htm", "utf8");

	let result: any[] = [];

	let theDocument = parse5.parse(roomData);
	// Getting the common information bounded to building
	let {fullBuildingName, roomAddress, roomLatitude, roomLongitude, numberOfRooms} = await commonBuildingInfo(
		theDocument
	);

	jsonGenerator(numberOfRooms, theDocument, id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result);
	return result;
}

// Input: node in html AST tree, tag type, tag value
// Output: if found, return the value of the tag
export function searchData(htmlNode: any, attributeType: string, attributeValue: string): any {
	if (htmlNode.attrs) {
		if (
			htmlNode.attrs.find(function (res: any) {
				return res.name === attributeType && res.value === attributeValue;
			})
		) {
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

// Input: address of the building
// Output: a promise which represent the longtitude and latitude of the building
export function getLongLat(address: string): Promise<any> {
	return new Promise((resolve) => {
		let formattedAddress =
			"http://cs310.students.cs.ubc.ca:11316/api/v1/project_team088/" + address.replace(/ /g, "%20");
		http.get(formattedAddress, function (received: any) {
			received.on("data", (requestedData: any) => {
				let JsonString = "" + requestedData;
				let longlatJson = JSON.parse(JsonString);
				resolve(longlatJson);
			});
		});
	});
}

// Calling the function
parseRoomData("DMP", "DMP.htm").then((a) => {
	console.log(a);
});
