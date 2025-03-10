const TAN_22_5 = Math.tan(Math.PI / 8);
const UTILITIES = {
	isBetween: (x, a, b) => x >= Math.min(a, b) && x < Math.max(a, b),
	runForTime: (object, callback, onComplete) => {
		const time = Date.now();
		for (const key in object) {
			callback(key);
			if (Date.now() - time > 20) {
				setTimeout(() => UTILITIES.runForTime(object, callback, onComplete));
				return;
			}
		}
		if (onComplete != null) {
			setTimeout(onComplete);
		}
	},
	connectLine: (x1, y1, direction1, offsetIndex1, routeCount1, x2, y2, direction2, offsetIndex2, routeCount2, lineWidth, segments) => {
		const offset1 = (offsetIndex1 - (routeCount1 - 1) / 2) * lineWidth;
		const offset2 = (offsetIndex2 - (routeCount2 - 1) / 2) * lineWidth;
		const offset1Rotated = UTILITIES.rotatePoint(offset1, 0, direction1);
		const offset2Rotated = UTILITIES.rotatePoint(offset2, 0, direction2);
		x1 += offset1Rotated["x"];
		y1 += offset1Rotated["y"];
		x2 += offset2Rotated["x"];
		y2 += offset2Rotated["y"];

		if (x2 > x1) {
			UTILITIES.connectLine1(x1, y1, direction1, offset1, routeCount1, x2, y2, direction2, offset2, routeCount2, lineWidth, segments);
			return false;
		} else {
			UTILITIES.connectLine1(x2, y2, direction2, offset2, routeCount2, x1, y1, direction1, offset1, routeCount1, lineWidth, segments);
			return true;
		}
	},
	connectLine1: (x1, y1, direction1, offset1, routeCount1, x2, y2, direction2, offset2, routeCount2, lineWidth, segments) => {
		const {x, y} = UTILITIES.rotatePoint(x2 - x1, y2 - y1, -direction1);
		const signX = Math.sign(x);
		const signY = Math.sign(y);
		const absX = Math.abs(x);
		const absY = Math.abs(y);
		const rotatedDirection = (direction2 - direction1 + 180) % 180;
		const isTopRight = (x > 0) === (y > 0);
		const points = [];

		points.push(UTILITIES.rotatePoint(0, 0, direction1));
		const halfRouteCount1 = routeCount1 * lineWidth / 2;
		const halfRouteCount2 = routeCount2 * lineWidth / 2;

		if (rotatedDirection === 0) {
			if (absX > absY) {
				const difference = absY / 2;
				const lineOffset = -clamp(offset1, absY / routeCount1) * signX * signY;
				const endOffset1 = clamp(-signX * offset1 * TAN_22_5 + halfRouteCount1, (difference - Math.abs(lineOffset)) / 2);
				const endOffset2 = clamp(signX * offset2 * TAN_22_5 + halfRouteCount2, (difference - Math.abs(lineOffset)) / 2);
				points.push(UTILITIES.rotatePoint(0, signY * endOffset1, direction1));
				points.push(UTILITIES.rotatePoint(signX * difference - signX * endOffset1 + signX * signY * lineOffset, signY * difference + lineOffset, direction1));
				points.push(UTILITIES.rotatePoint(x - signX * difference + signX * endOffset2 + signX * signY * lineOffset, signY * difference + lineOffset, direction1));
				points.push(UTILITIES.rotatePoint(x, y - signY * endOffset2, direction1));
			} else {
				const offsetDifference = offset2 - offset1;
				const difference = (absY - absX + offsetDifference) / 2;
				const lineOffset = clamp((isTopRight ? -(direction1 === 0 ? offset1 : offset2) : offset1) * TAN_22_5, difference);
				points.push(UTILITIES.rotatePoint(0, signY * difference + lineOffset, direction1));
				points.push(UTILITIES.rotatePoint(x, y - signY * difference + lineOffset + (direction1 === 0 ? signX * signY : -1) * offsetDifference, direction1));
			}
		} else {
			const getFinalPoint = () => UTILITIES.rotatePoint(0, clamp((direction1 === 0 || direction1 === 45 ? 1 : -1) * offset2 * TAN_22_5 + halfRouteCount2, absX / 2), rotatedDirection);
			if (absX > absY) {
				const endOffset1 = clamp(-signX * offset1 * TAN_22_5 + halfRouteCount1, absY / 2);
				points.push(UTILITIES.rotatePoint(0, signY * endOffset1, direction1));
				if (rotatedDirection === 90) {
					points.push(UTILITIES.rotatePoint(signX * absY - signX * endOffset1, y, direction1));
				} else {
					const offsetDifference = offset2 - offset1;
					const finalPoint = getFinalPoint();
					points.push(UTILITIES.rotatePoint(signX * absY - signX * endOffset1 + (direction2 === 45 ? -1 : 1) * signY * finalPoint["x"], y + finalPoint["y"], direction1));
					points.push(UTILITIES.rotatePoint(x + finalPoint["x"], y + finalPoint["y"], direction1));
				}
			} else {
				if (rotatedDirection === 90) {
					const endOffset2 = clamp((direction1 === 0 || direction1 === 45 ? 1 : -1) * signY * offset2 * TAN_22_5 + halfRouteCount2, absX / 2);
					points.push(UTILITIES.rotatePoint(0, y - signY * absX + (isTopRight ? 1 : -1) * signX * endOffset2, direction1));
					points.push(UTILITIES.rotatePoint(x - signX * endOffset2, y, direction1));
				} else {
					
				}
			}
		}

		points.push(UTILITIES.rotatePoint(x, y, direction1));
		points.forEach(point => segments.push({"x": point["x"] + x1, "y": point["y"] + y1}));
	},
	getDrawStationElement: (stationElement, color1, color2) => {
		const element = document.createElement("div");
		element.className = "route_station_name text";
		if (color1 != null) {
			element.innerHTML = `<span class="route_segment bottom" style="background-color: ${UTILITIES.convertColor(color1)}">&nbsp</span>`;
		}
		if (color2 != null) {
			element.innerHTML += `<span class="route_segment top" style="background-color: ${UTILITIES.convertColor(color2)}">&nbsp</span>`;
		}
		element.innerHTML += `<span class="station_circle"></span>`;
		element.appendChild(stationElement);
		return element;
	},
	getDrawLineElement: (icon, innerElement, color, htmlBefore) => {
		const element = document.createElement("div");
		element.className = "route_duration";
		element.innerHTML =
			`<span class="route_segment ${color == null ? "walk" : ""}" style="background-color: ${color == null ? 0 : UTILITIES.convertColor(color)}">&nbsp</span>` +
			(htmlBefore ? htmlBefore : "") +
			`<span class="material-icons small">${icon}</span>`;
		element.appendChild(innerElement);
		return element;
	},
	convertGtfsRouteType: routeType => {
		switch (routeType) {
			case 0:
			case 5:
			case 12:
				return "train_light_rail";
			case 2:
				return "train_high_speed";
			case 3:
			case 11:
				return "bus_normal";
			case 4:
				return "boat_light_rail";
			case 6:
				return "cable_car_normal";
			default:
				return "train_normal";
		}
	},
	directionToAngle: direction => {
		const directionIndex = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].indexOf(direction);
		return UTILITIES.angles[(directionIndex >= 0 ? directionIndex : 0) % UTILITIES.angles.length];
	},
	formatTime: time => {
		const hour = Math.floor(time / 3600);
		const minute = Math.floor(time / 60) % 60;
		const second = Math.floor(time) % 60;
		return (hour > 0 ? hour.toString() + ":" : "") + (hour > 0 ? minute.toString().padStart(2, "0") : minute.toString()) + ":" + second.toString().padStart(2, "0");
	},
	getColorStyle: style => parseInt(getComputedStyle(document.body).getPropertyValue(style).replace(/#/g, ""), 16),
	convertColor: colorInt => "#" + Number(colorInt).toString(16).padStart(6, "0"),
	isCJK: text => text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/),
	removeFromArray: (array, element) => {
		const index = array.indexOf(element);
		if (index > -1) {
			array.splice(index, 1);
		}
	},
	rotatePoint: (x, y, direction) => {
		const getSin = direction => {
			switch ((direction + 360) % 360) {
				case 90:
					return 1;
				case 270:
					return -1;
				case 45:
				case 135:
					return Math.SQRT1_2;
				case 225:
				case 315:
					return -Math.SQRT1_2;
				default:
					return 0;
			}
		};
		const getCos = direction => {
			switch ((direction + 360) % 360) {
				case 0:
					return 1;
				case 180:
					return -1;
				case 45:
				case 315:
					return Math.SQRT1_2;
				case 135:
				case 225:
					return -Math.SQRT1_2;
				default:
					return 0;
			}
		};
		return {
			"x": x * getCos(direction) - y * getSin(direction),
			"y": x * getSin(direction) + y * getCos(direction),
		};
	},
	routeTypes: {
		"train_normal": "directions_train",
		"train_light_rail": "tram",
		"train_high_speed": "train",
		"boat_normal": "sailing",
		"boat_light_rail": "directions_boat",
		"boat_high_speed": "snowmobile",
		"cable_car_normal": "airline_seat_recline_extra",
		"bus_normal": "directions_bus",
		"bus_light_rail": "local_taxi",
		"bus_high_speed": "airport_shuttle",
		"airplane_normal": "flight",
	},
	angles: [0, 45, 90, 135],
	fonts: ["Microsoft Yahei","PingFangSC-Medium"],
	obaMode: false,
	testMode: false,
};

const clamp = (x, bound) => Math.max(Math.min(x, bound), -bound);

export default UTILITIES;
