import UTILITIES from "./utilities.js";
import DATA from "./data.js";
import DOCUMENT from "./document.js";
import SETTINGS from "./settings.js";
import DRAWING from "./drawing.js";
import DIRECTIONS from "./directions.js";

const ACTIONS = {
	onClickStation: id => {
		DOCUMENT.onClearSearch(false);
		DOCUMENT.clearPanes(false);
		const {stations, routes} = DATA.json[SETTINGS.dimension];
		const {name, color, zone, x, z} = stations[id];
		const stationInfoElement = document.getElementById("station_info");
		stationInfoElement.removeAttribute("style");
		DRAWING.zoomToPoint(x, z);

		let stationNameHtml = "";
		const nameSplit = name.split("|");
		for (const nameSplitIndex in nameSplit) {
			const namePart = nameSplit[nameSplitIndex];
			if (UTILITIES.isCJK(namePart) && nameSplitIndex==0) {
				stationNameHtml += "<h1>" + namePart + "</h1>";
			} else {
				stationNameHtml += "<h2>" + namePart + "</h2>";
			}
		}

		document.getElementById("station_name").innerHTML = stationNameHtml;
		document.getElementById("station_coordinates").innerText = `(${Math.round(x)}, ${Math.round(z)})`;
		document.getElementById("station_zone").innerText = zone;
		document.getElementById("station_line").style.backgroundColor = UTILITIES.convertColor(color);
		document.getElementById("station_copy").onclick = event => {
			navigator.clipboard.writeText(`/tp ${x} ~ ${z}`).then();
			event.target.innerText = "check";
			setTimeout(() => event.target.innerText = "content_copy", 1000);
		};
		const stationRoutesElement = document.getElementById("station_routes");
		stationRoutesElement.innerHTML = "";
		const addedRouteIds = [];
		for (const routeIndex in routes) {
			const route = routes[routeIndex];
			const routeId = route["id"];
			if (!addedRouteIds.includes(routeId)) {
				for (const stationIndex in route["stations"]) {
					if (route["stations"][stationIndex].split("_")[0] === id) {
						stationRoutesElement.append(ACTIONS.getRouteElement(routeId, route["color"], route["name"], route["number"], route["type"], true, true, "", true));
						addedRouteIds.push(routeId);

						const arrivalElement = document.createElement("div");
						arrivalElement.id = "station_arrivals_" + routeId;
						stationRoutesElement.append(arrivalElement);

						const spacerElement = document.createElement("div");
						spacerElement.className = "spacer";
						stationRoutesElement.append(spacerElement);

						break;
					}
				}
			}
		}

		if (stationRoutesElement.lastChild != null) {
			stationRoutesElement.removeChild(stationRoutesElement.lastChild);
		}

		stationInfoElement.style.maxHeight = window.innerHeight - 80 + "px";
		SETTINGS.selectedStation = id;
	},
	setupRouteTypeAndDimensionButtons: () => {
		const availableTypes = DATA.json[SETTINGS.dimension]["types"];
		const oneOrFewerTypes = availableTypes.length <= 1;
		document.getElementById("settings_route_types").style.display = oneOrFewerTypes ? "none" : "";
		if (oneOrFewerTypes) {
			availableTypes.forEach(routeType => SETTINGS.selectedRouteTypes.push(routeType));
		} else if (SETTINGS.selectedRouteTypes.filter(routeType => availableTypes.includes(routeType)).length === 0) {
			SETTINGS.selectedRouteTypes = [availableTypes[0]];
		}

		for (const routeType of Object.keys(UTILITIES.routeTypes)) {
			const element = document.getElementById("settings_route_type_" + routeType);
			element.className = "material-icons clickable " + (SETTINGS.selectedRouteTypes.includes(routeType) ? "selected" : "");
			element.style.display = availableTypes.includes(routeType) ? "" : "none";
			element.onclick = () => {
				if (SETTINGS.selectedRouteTypes.includes(routeType)) {
					SETTINGS.selectedRouteTypes = SETTINGS.selectedRouteTypes.filter(checkType => checkType !== routeType);
				} else {
					SETTINGS.selectedRouteTypes.push(routeType);
				}
				DATA.redraw();
			}
		}

		const settingsDimensionsButtons = document.getElementById("settings_dimensions_buttons");
		settingsDimensionsButtons.innerHTML = "";
		let dimensionButtonCount = 0;
		for (const dimensionIndex in DATA.json) {
			if (DATA.json[dimensionIndex]["routes"].length > 0) {
				const element = document.createElement("span");
				element.id = "toggle_dimension_icon_" + dimensionIndex;
				element.className = "material-icons clickable " + (SETTINGS.dimension === parseInt(dimensionIndex) ? "selected" : "");
				element.innerText = "public"
				element.onclick = () => {
					SETTINGS.dimension = parseInt(dimensionIndex);
					DATA.redraw();
				}
				settingsDimensionsButtons.appendChild(element);
				settingsDimensionsButtons.appendChild(document.createTextNode("\n"));
				dimensionButtonCount++;
			}
		}

		document.getElementById("settings_dimensions").style.display = dimensionButtonCount <= 1 ? "none" : "";
	},
	getStationElement: (color, name, stationId, elementId) => {
		const element = document.createElement("div");
		element.setAttribute("id", elementId);
		element.setAttribute("class", "clickable");
		element.onclick = () => ACTIONS.onClickStation(stationId);
		element.innerHTML =
			(color == null ? "" : `<span class="station" style="background: ${UTILITIES.convertColor(color)}"></span>`) +
			`<span class="text">${name.replace(/\|/g, " ")}</span>`;
		return element;
	},
	getRouteElement: (routeId, color, name, number, type, visible, showColor, elementId, forceClick) => {
		name = name.split("||")[0].replace(/\|/g, " ");
		number = number.split("||")[0].replace(/\|/g, " ");
		const element = document.createElement("div");
		element.setAttribute("id", elementId);
		element.setAttribute("class", "clickable");
		element.setAttribute("style", "overflow-x: clip");
		if (!visible) {
			element.setAttribute("style", "display: none");
		}
		element.onclick = () => onClickLine(routeId, color, forceClick);
		element.innerHTML =
			`<span class="line" style="background: ${UTILITIES.convertColor(showColor ? color : UTILITIES.getColorStyle("--textColorDisabled"))}"></span>` +
			`<span class="${showColor ? "text" : "text_disabled"} material-icons tight">${UTILITIES.routeTypes[type]}</span>` +
			`<span class="${showColor ? "text" : "text_disabled"}">${number}${number ? " " : ""}${name}</span>`;
		return element;
	},
	getClosestInterchangeOnRoute: (route, thisStation) => {
		const {routes, stations} = DATA.json[SETTINGS.dimension];
		const routeStations = route["stations"];
		let passed = false;
		for (let i = 0; i < routeStations.length; i++) {
			const checkStation = routeStations[i].split("_")[0];
			if (passed && (routes.some(checkRoute => checkRoute["color"] !== route["color"] && checkRoute["stations"].some(checkRouteStation => checkRouteStation.split("_")[0] === checkStation)) || i === routeStations.length - 1)) {
				return stations[checkStation]["name"];
			}
			if (checkStation === thisStation) {
				passed = true;
			}
		}
	},
};
const onClickLine = (routeId, color, forceClick) => {
	const shouldSelect = forceClick || !SETTINGS.selectedRoutes.includes(routeId);
	DOCUMENT.onClearSearch(false);
	DOCUMENT.clearPanes(false);
	document.getElementById("route_stations_tab").style.display = "none";
	document.getElementById("route_delays_tab").style.display = "none";
	const data = DATA.json[SETTINGS.dimension];
	onSelectDelaysTab(false);

	if (shouldSelect) {
		const selectedRoutes = data["routes"].filter(route => route["id"] === routeId);
		const routeInfoElement = document.getElementById("route_info");
		routeInfoElement.removeAttribute("style");

		let routeNameHtml = "";
		const nameSplit = selectedRoutes[0]["name"].split("||")[0].split("|");
		for (const nameSplitIndex in nameSplit) {
			const namePart = nameSplit[nameSplitIndex];
			if (UTILITIES.isCJK(namePart)) {
				routeNameHtml += "<h1>" + namePart + "</h1>";
			} else {
				routeNameHtml += "<h2>" + namePart + "</h2>";
			}
		}

		document.getElementById("route_name").innerHTML = routeNameHtml;
		document.getElementById("route_line").style.backgroundColor = UTILITIES.convertColor(color);

		const routeDetailsElement = document.getElementById("route_details");
		routeDetailsElement.innerHTML = "";

		selectedRoutes.forEach(route => {
			const {stations, durations, name, number, circular, type} = route;
			addRouteHeader(routeDetailsElement, number, stations.length > 0 ? data["stations"][stations[stations.length - 1].split("_")[0]]["name"] : "", circular, name);

			const routeStationsElement = document.createElement("div");
			routeStationsElement.className = "station_list"

			for (let i = 0; i < stations.length; i++) {
				const stationId = stations[i].split("_")[0];
				routeStationsElement.appendChild(UTILITIES.getDrawStationElement(ACTIONS.getStationElement(null, data["stations"][stationId]["name"], stationId, ""), i === 0 ? null : color, i === stations.length - 1 ? null : color));

				if (i < durations.length && durations[i] > 0) {
					const element = document.createElement("span");
					element.innerHTML = UTILITIES.formatTime(durations[i] / 20);
					routeStationsElement.appendChild(UTILITIES.getDrawLineElement("schedule", element, color));
				}
			}

			routeDetailsElement.appendChild(routeStationsElement);

			const spacerElement = document.createElement("div");
			spacerElement.className = "spacer padded";
			routeDetailsElement.append(spacerElement);

			if (!SETTINGS.selectedRouteTypes.includes(type)) {
				SETTINGS.selectedRouteTypes.push(type);
			}
		});

		if (routeDetailsElement.lastChild != null) {
			routeDetailsElement.removeChild(routeDetailsElement.lastChild);
		}

		routeInfoElement.style.maxHeight = window.innerHeight - 80 + "px";
		UTILITIES.removeFromArray(SETTINGS.selectedRoutes, routeId);
		SETTINGS.selectedRoutes.push(routeId);
	} else {
		UTILITIES.removeFromArray(SETTINGS.selectedRoutes, routeId);
	}

	DIRECTIONS.drawDirectionsRoute([], {});
	DATA.redraw();
};
const addRouteHeader = (element, number, destination, circular, routeName) => {
	const headerElement = document.createElement("h3");
	headerElement.innerHTML = number.replace(/\|/g, " ") + `<span class="material-icons tight">${circular === "" ? "chevron_right" : circular === "cw" ? "rotate_right" : "rotate_left"}</span>` + destination.replace(/\|/g, " ");
	element.appendChild(headerElement);

	const routeNameSplit = routeName.split("||");
	if (routeNameSplit.length > 1) {
		const smallHeaderElement = document.createElement("h4");
		smallHeaderElement.innerText = routeNameSplit[1].replace(/\|/g, " ");
		element.appendChild(smallHeaderElement);
	}
};
const onSelectDelaysTab = selectDelaysTab => {
	selectedDelaysTab = selectDelaysTab;
	document.getElementById("route_stations_tab").className = "material-icons clickable" + (selectedDelaysTab ? "" : " selected");
	document.getElementById("route_delays_tab").className = "material-icons clickable" + (selectedDelaysTab ? " selected" : "");
	document.getElementById("route_details").style.display = selectedDelaysTab ? "none" : "";
	document.getElementById("delays").style.display = selectedDelaysTab ? "" : "none";
};

let selectedDelaysTab = false;
let delayCopyButton = "";
document.getElementById("route_stations_tab").onclick = () => onSelectDelaysTab(false);
document.getElementById("route_delays_tab").onclick = () => onSelectDelaysTab(true);

export default ACTIONS;