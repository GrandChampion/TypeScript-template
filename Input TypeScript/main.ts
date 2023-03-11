import * as fs from "fs-extra";
import * as parse5 from "parse5";

// Input: single html string (e.g DMP.htm)
// Effect save room.json to following location
export function parseRoomData(id: String, htmlData: String): void {

    let roomData = fs.readFileSync("DMP1.htm", "utf8")

    // console.log(roomData)

    const document1 = parse5.parse(roomData);
    let fullBuildingName = findId(document1, "id", "building-info").childNodes[1].childNodes[0].childNodes[0].value;
    let roomNumbers = findId(document1, "class", "views-field views-field-field-room-furniture").value

    console.log(roomNumbers)

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
    }


}


// recursively find id from html tree
function findId(node: any, attributeType: String, attributeValue: String): any {
    if (node.attrs && node.attrs.find((attr: any) => attr.name === attributeType && attr.value === attributeValue)) {
        return node;
    } else if (node.childNodes) {
        for (const childNode of node.childNodes) {
            const foundNode = findId(childNode, attributeType, attributeValue);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return undefined;
}

parseRoomData("DMP", "DMP.htm")