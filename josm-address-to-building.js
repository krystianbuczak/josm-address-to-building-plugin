/**
 * Sometimes as an OpenStreetMap contributor (editor) you can need 
 * to merge building and address elements that were added separately.
 * This script allows you to do this job automaticly, according to an 
 * area downloaded to JOSM editor.
 *
 * In order to use this plugin you need JOSM with Scripting plugin enabled.
 * More information:
 * JOSM - http://josm.openstreetmap.de/
 * JOSM Scripting Plugin - https://github.com/Gubaer/josm-scripting-plugin
 * JavaScript API - http://gubaer.github.io/josm-scripting-plugin/apidoc/namespaces/josm.html
 */

var JSAction = require("josm/ui/menu").JSAction;
var cmd = require("josm/command");
var util = require("josm/util");

// Uncomment if want to use console
// var console = require("josm/scriptingconsole");

// To query some specific data we need active JOSM data layer, so we need this warning first (comment if annoying)
josm.alert("Please make sure the layer with proper data you want to process is active. It is important also to process relative small number of buildings and visual check for posible errors like dual address points on one building.")
var layer = josm.layers.activeLayer;
var layerData =  layer.data;
var layerName = layer.name;

util.assert(util.isDef(layerData && layerData.dataSources), "I told you to set your data layer as active! Currently your active layer is: ("+layerName+") and has no data to process! You must set your data layer as active.");

/**
 * Check if point (node) is in polygon (building)
 * @param {Object} with lattitude. longitude properties 
 * @param {Object} with lattitude. longitude properties
 * @return boolean
 */
function isInBuilding (building, node){
	//check if function have valid parameters
	util.assert(util.isSomething(building), "There is no building.");
	util.assert(util.isSomething(node), "There is no node.");
  for (var c = false, i = -1, l = building.length, j = l - 1; ++i < l; j = i)
    ((building[i].lon <= node.lon && node.lon < building[j].lon) || (building[j].lon <= node.lon && node.lon < building[i].lon))
    && (node.lat < (building[j].lat - building[i].lat) * (node.lon - building[i].lon) / (building[j].lon - building[i].lon) + building[i].lat)
    && (c = !c);
    return c;
}

/**
 * Loop changing node's tags (address) if in polygon
 * @param {Object} with all nodes having address tags
 * @param {Object} with all ways having building tags
 * @return 
*/
function changeAddr (addresses, buildings) {
	var counter = 0;
	for (var buildingIndex=0; buildingIndex<buildings.length; buildingIndex++) {
		building = buildings[buildingIndex];

		for (var addressIndex=0; addressIndex<addresses.length; addressIndex++) {
			address = addresses[addressIndex];
	    if (isInBuilding(building.nodes, address)) {
          // Copy addr tags for each building
          cmd.change(building, {tags: address.tags}).applyTo(layer);
          
          // Delete proper node with addr tags
          cmd.delete(address).applyTo(layer);
          // Count changed items
          counter++;
    	}
  	}
	}
	josm.alert("There were " + buildings.length + " buildings and " + addresses.length + " addresses. We've changed " + counter + " of them.")
}
//Find all ways with building tag in the layer
var buildings = layerData.query('building=* type:way -"addr:housenumber"');
//Find all nodes with addr tag in the layer
var addresses = layerData.query('"addr:housenumber" type:node');
util.assert(util.hasProperties(buildings && addresses), "Buildings and/or addresses are not objects or have no properties");

//OK, so let things happen
changeAddr(addresses, buildings);
