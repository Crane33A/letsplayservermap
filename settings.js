import UTILITIES from "./utilities.js";

const SETTINGS = {
	dimension: 0,
	selectedRoutes: [],
	selectedStation: 0,
	selectedDirectionsStations: [],
	selectedDirectionsSegments: {},
	selectedRouteTypes: [Object.keys(UTILITIES.routeTypes)[0]],
	densityView: 0,
	showText: true,
	showLegend: true,
	size: 1,
	url: document.location.origin + document.location.pathname.replace("index.html", ""),
	original_url: "https://letsplay.minecrafttransitrailway.com/system-map/", //用于未来切换离/在线模式,暂时无用
	//所谓动态模式和静态模式是指:当用户正在拖动、放大缩小地图时,将自动切换到动态模式帧率,而在静止后自动切换回静态模式帧率,
	//以降低尤其是诸如齐齐玩服务器这样的大型地图下的性能开销,理论上静态帧率设置为1也不会卡顿,因为判断是否切换动态模式帧率的判断频次依旧与显示器刷新率同步
	dynamic_framerate: 120,  //设置动态模式下的帧率
	high_dynamic_framerate: 240,
	fixed_framerate: 10,  //设置静态模式下的帧率
	showFPS:1 //设为任何非0值则在左上角显示帧数和当前帧率模式,设为0则不显示
};

export default SETTINGS;
