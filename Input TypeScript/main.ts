import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as http from "http";





export function stringList2jsonList(id: string, htmlArray: string[]) {
    let jsonList = [];
    for (let html of htmlArray) {
        let json = parseRoomData(id, html);
        jsonList.push(json);
    }
    return jsonList;
}

// Input: single html string (e.g DMP.htm)
// Effect save room.json to following location
export async function parseRoomData(id: string, htmlData: string): Promise<void> {
    let roomData = fs.readFileSync("DMP1.htm", "utf8");

    // console.log(roomData)

    let document1 = parse5.parse(roomData);
    // Getting the same things: full name, short name, address, lat, lon
    let fullBuildingName = searchData(document1, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value.trim();
    // let shortBuildingName
    let address = searchData(document1, "id", "building-info").childNodes[3].childNodes[0].childNodes[0].value.trim();

    let addressLongLat = await getLongLat(address);
    let latitude = addressLongLat.lat;
    let longitude = addressLongLat.lon;

    // console.log(latitude);
    // console.log(longitude);
    let numberOfRooms = Math.floor(
        searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes.length / 2
    );

    let i = 3
    // getting different things: number, seats, type, furniture, href
    let roomNumbers = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
        .childNodes[1].childNodes[1].childNodes[0].value.trim();
    let roomSeats = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
        .childNodes[3].childNodes[0].value.trim();
    let roomFurniture = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
        .childNodes[5].childNodes[0].value.trim();
    let roomType = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
        .childNodes[7].childNodes[0].value.trim();
    let roomHref = searchData(document1, "class", "views-table cols-5 table").childNodes[3].childNodes[2 * i - 1]
        .childNodes[9].childNodes[1].attrs[0].value.trim();

    // Print
    console.log(fullBuildingName)
    console.log(address);
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
        [id + "_href"]: String,
    };
}

export function searchData(node: any, attributeType: string, attributeValue: string): any {
    if (node.attrs) {
        if (
            node.attrs.find(function (res: any) {
                return res.name === attributeType && res.value === attributeValue;
            })
        ) {
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

parseRoomData("DMP", "DMP.htm");
