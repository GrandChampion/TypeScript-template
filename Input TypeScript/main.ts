import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as http from "http";
import { Document } from "parse5/dist/tree-adapters/default";


// Input: an array containing the html files as strings
// Output: an array containing the json files
export function stringList2jsonList(id: string, htmlArray: string[]): Promise<any[]> {
	const jsonList: any[] | PromiseLike<any[]> = [];
	let promises = [];
	for (let i = 0; i < htmlArray.length; i++) {
		promises.push(parseRoomData(id, htmlArray[i]));
	}

	return Promise.all(promises)
		.then((arr) => {
			// process the data and return the result

			for (let i = 0; i < arr.length; i++) {
				for (let j = 0; j < arr[i].length; j++) {
					jsonList.push(arr[i][j]);
				}
			}

			return jsonList;
		})
		.catch((error) => {
			// handle errors and return a rejected promise
			return Promise.reject(error);
		});
}

// Input: id of the Dataset, an html file which represents a building as a string
// Output: an array of json, each representing a room in the building
export async function parseRoomData(id: string, htmlData: string): Promise<Array<{ [x: string]: any }>> {
	let result: any[] = [];

	let theDocument = parse5.parse(htmlData);

	let tables = findAllTables(theDocument);
	let filteredTable = []
	for (let i = 0; i < tables.length; i++) {
		let table = tables[i];
		//Check if the table has all the fields we need
		if (table.childNodes[1].childNodes[1].childNodes[1].attrs[0].value === "views-field views-field-field-room-number"
			&& table.childNodes[1].childNodes[1].childNodes[3].attrs[0].value === "views-field views-field-field-room-capacity"
			&& table.childNodes[1].childNodes[1].childNodes[5].attrs[0].value === "views-field views-field-field-room-furniture"
			&& table.childNodes[1].childNodes[1].childNodes[7].attrs[0].value === "views-field views-field-field-room-type"
			&& table.childNodes[1].childNodes[1].childNodes[9].attrs[0].value === "views-field views-field-nothing") {
			filteredTable.push(table);
		}
	}

	// Checking if the five columns exist in the table
	if (filteredTable.length > 0) {
		// Getting the common information bounded to building
		let { fullBuildingName, roomAddress, roomLatitude, roomLongitude, numberOfRooms } = await commonBuildingInfo(
			theDocument
		);

		// Checking if geolocation is okay
		if (roomLatitude === undefined || roomLongitude === undefined) {
			return result;
		}

		jsonGenerator(numberOfRooms, filteredTable[0], id, fullBuildingName, roomAddress, roomLatitude, roomLongitude, result);
	}
	return result;
}

// Input: html file
// Output: an object containing common building information
export async function commonBuildingInfo(theDocument: Document): Promise<{ [x: string]: any }> {
	let fullBuildingName: string = searchData(
		theDocument,
		"id",
		"building-info"
	).childNodes[1].childNodes[0].childNodes[0].value.trim();
	let numberOfRooms = Math.floor(
		searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2
	);
	// let shortBuildingName
	let roomAddress = searchData(
		theDocument,
		"id",
		"building-info"
	).childNodes[3].childNodes[0].childNodes[0].value.trim();
	let addressLongLat = await getLongLat(roomAddress);
	let roomLatitude = addressLongLat.lat;
	let roomLongitude = addressLongLat.lon;


	return {
		fullBuildingName,
		roomAddress,
		roomLatitude,
		roomLongitude,
		numberOfRooms,
	};
}

// Input: Building informations, which are common to all rooms in the building
// Output: no return value, but the function will write the json file
export function jsonGenerator(
	numberOfRooms: number,
	theTable: any,
	id: string,
	fullBuildingName: string,
	roomAddress: string,
	roomLatitude: any,
	roomLongitude: any,
	result: Array<{ [p: string]: any }>
): void {

	let insideTable = theTable.childNodes[3]
	let roomNumberList = []
	let roomSeatsList = []
	let roomFurnituresList = []
	let roomTypesList = []
	let roomHrefList = []

	for (let i = 1; i < numberOfRooms * 2; i += 2) {
		roomNumberList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-number").childNodes[1].childNodes[0].value.trim())
		roomSeatsList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-capacity").childNodes[0].value.trim())
		roomFurnituresList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-furniture").childNodes[0].value.trim())
		roomTypesList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-field-room-type").childNodes[0].value.trim())
		roomHrefList.push(searchData(insideTable.childNodes[i], "class", "views-field views-field-nothing").childNodes[1].attrs[0].value.trim())
	}

	for (let i = 1; i <= numberOfRooms; i++) {
		// Getting information specific to each room
		let roomNumber = roomNumberList[i - 1]
		let roomSeats = roomSeatsList[i - 1]
		let roomFurniture = roomFurnituresList[i - 1]
		let roomType = roomTypesList[i - 1]
		let roomHref = roomHrefList[i - 1]
		let shortBuildingName = shortNameGenerator(roomHref)

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

function findAllTables(document: Document): any[] {
	const tables: any[] = [];

	function findTables(node: any) {
		if (node.nodeName === 'table') {
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

export function shortNameGenerator(url: string): string {
	let nodeArray = url.split("/");
	let roomNameArray = nodeArray[nodeArray.length - 1].split("-");
	let shortBuildingName = roomNameArray[0];
	return shortBuildingName;
}

// Calling the function
// parseRoomData("DMP", "DMP.htm").then((a) => {
// 	console.log(a);
// });


// read DMP1.htm to string
let DMPstring = fs.readFileSync("DMP.htm", "utf8");
let BRKXstring = fs.readFileSync("BRKX.htm", "utf8");
let ICCSstring = fs.readFileSync("ICCS.htm", "utf8");

// make string array
let buildingList: any[] = [];

//put roomData into theList1
buildingList.push(DMPstring);
buildingList.push(BRKXstring);
buildingList.push(ICCSstring);


stringList2jsonList("Harvard", buildingList).then((a) => {
	console.log(a);
})

// parseRoomData("Stanford", buildingList[1]).then((a) => {
// 	console.log(a);
// })

// Filter html files



// parseRoomData("MIT", buildingList[0]).then((a) => {
// 	console.log(a);
// })
// get the list of items in <tbody> of DMP.htm
// let tbody = searchData(theDocument, "class", "views-table cols-5 table").childNodes[3].childNodes;
// console.log(tbody);

// get every table in DMP.htm
// let table = searchData(theDocument, "class", "views-table cols-5 table");
// console.log(table);
