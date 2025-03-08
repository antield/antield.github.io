import GPSTool from "./translateCoordinate.js";
import {
  transform as olTransform
} from 'ol/proj';


// 与百度瓦片resolution比为1.1943285669558789730072021484375(1.194328566955879)
const resolutionFactorX = 1.1941564946533966936793789509082;
const resolutionFactorY = 1.1877121437972757732373070472108;

// 原点偏移
const originOffsetX = -1984.0872634102814868112746432433;
const originOffsetY = 2300.4335777362416530934350726955;

function olTransform4326To3857(coord) {
  return olTransform(coord, "EPSG:4326", "EPSG:3857");
}

function olTransform3857To4326(coord) {
  return olTransform(coord, "EPSG:3857", "EPSG:4326");
}

/**
 * 将WGS坐标系转换为国测局坐标系（火星坐标系）
 */
export function Convert2Mars(wgsCoord) {
  let xWgs = wgsCoord[0];
  let yWgs = wgsCoord[1];
  if (typeof xWgs == "string") xWgs = parseFloat(xWgs);
  if (typeof yWgs == "string") yWgs = parseFloat(yWgs);

  //let pi = 3.14159265358979324;
  let pi = Math.PI;
  let a = 6378245.0;
  let ee = 0.00669342162296594323;

  //	if (!isInChina(xWgs, yWgs))	return [ xWgs, yWgs ];

  let x = 0,
    y = 0;
  x = xWgs - 105.0;
  y = yWgs - 35.0;

  let dLon = 300.0 + 1.0 * x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  dLon += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  dLon += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
  dLon += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;

  let dLat = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  dLat += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  dLat += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
  dLat += (160.0 * Math.sin(y / 12.0 * pi) + 320.0 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;

  let radLat = yWgs / 180.0 * pi;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
  let xMars = xWgs + dLon;
  let yMars = yWgs + dLat;

  return [xMars, yMars];
}

/**
 * 将百度坐标系转换为百度离线坐标系
 */
export function transformBaiduToOfflineCoord(baiduCoord) {
  if (typeof baiduCoord[0] == "string")
    baiduCoord[0] = parseFloat(baiduCoord[0]);
  if (typeof baiduCoord[1] == "string")
    baiduCoord[1] = parseFloat(baiduCoord[1]);
  let webCoordinate = olTransform4326To3857(baiduCoord);
  return coordToOffset(webCoordinate);
}

/**
 * 将国测局坐标系转换为百度离线坐标系
 */
export function transformGcjToOfflineCoord(gcjCoord) {
  let baiduCoord = GPSTool.bd_encrypt(gcjCoord);
  let viewCoord = transformBaiduToOfflineCoord(baiduCoord);
  return viewCoord;
}

/**
 * 将百度离线坐标系转换为百度坐标系
 */
export function transformOfflineToBaiduCoord(offlineCoord) {
  let destCoord = coordFromOffset(offlineCoord);
  let baiduCoordinate = olTransform3857To4326(destCoord);
  return baiduCoordinate;
}

/**
 * 将3857坐标系转换为百度离线坐标系
 */
function coordToOffset(webCoordinate) {
  let destLon = webCoordinate[0];
  let destLat = webCoordinate[1];
  destLon = (destLon - originOffsetX) * resolutionFactorX;
  destLat = (destLat - originOffsetY) * resolutionFactorY;
  return [destLon, destLat];
}

/**
 * 将百度离线坐标系转换为3857坐标系
 */
function coordFromOffset(offlineCoord) {
  let destLon = offlineCoord[0];
  let destLat = offlineCoord[1];
  destLon = destLon / resolutionFactorX + originOffsetX;
  destLat = destLat / resolutionFactorY + originOffsetY;
  return [destLon, destLat];
}


/**
 * 将Web3857转为2.5D坐标
 */
export function getDimension25FromWeb3857(coord3857) {
  let lon = coord3857[0];
  let lat = coord3857[1];
  if (typeof lon == "string") lon = parseFloat(lon);
  if (typeof lat == "string") lat = parseFloat(lat);
  let rArr = new Array();
  rArr[0] = Math.sqrt(2) * (lon + lat) / 2
  rArr[1] = (lat - lon) / 2
  return rArr;
}

/**
 * 将2.5D坐标转为Web3857
 */
export function getWeb3857fromDimension25(coordDimension25) {
  let lon = coordDimension25[0];
  let lat = coordDimension25[1];
  if (typeof lon == "string") lon = parseFloat(lon);
  if (typeof lat == "string") lat = parseFloat(lat);
  let rArr = new Array();
  rArr[0] = (Math.sqrt(2) * lon - 2 * lat) / 2
  rArr[1] = (Math.sqrt(2) * lon + 2 * lat) / 2
  return rArr;
}


/**
 * 将WGS坐标系转换为2.5D坐标系
 */
export function transformWgsToDimension25Coord(wgsCoord) {
  if (typeof wgsCoord[0] == "string")
    wgsCoord[0] = parseFloat(wgsCoord[0]);
  if (typeof wgsCoord[1] == "string")
    wgsCoord[1] = parseFloat(wgsCoord[1]);
  let gcjCoord = GPSTool.gcj_encrypt(wgsCoord);
  let coord3857 = olTransform4326To3857(gcjCoord);
  let coordDimension25 = getDimension25FromWeb3857(coord3857);
  return coordDimension25;
}

/**
 * 将2.5D坐标系转换为WGS坐标系
 */
export function transformDimension25ToWgsCoord(coordDimension25) {
  if (typeof coordDimension25[0] == "string")
    coordDimension25[0] = parseFloat(coordDimension25[0]);
  if (typeof coordDimension25[1] == "string")
    coordDimension25[1] = parseFloat(coordDimension25[1]);
  let coord3857 = getWeb3857fromDimension25(coordDimension25)
  let gcjCoord = olTransform3857To4326(coord3857);
  let wgsCoord = GPSTool.gcj_decrypt(gcjCoord);
  return wgsCoord;
}

/**
 * 将WGS坐标系转换为百度瓦片坐标系
 */
export function transformWgsToOfflineCoord(wgsCoord) {
  if (typeof wgsCoord[0] == "string")
    wgsCoord[0] = parseFloat(wgsCoord[0]);
  if (typeof wgsCoord[1] == "string")
    wgsCoord[1] = parseFloat(wgsCoord[1]);
  let gcjCoord = GPSTool.gcj_encrypt(wgsCoord);
  let baiduCoord = GPSTool.bd_encrypt(gcjCoord);
  let webCoordinate = olTransform4326To3857(baiduCoord);
  let viewCoord = coordToOffset(webCoordinate);
  return viewCoord;
}

/**
 * 将百度瓦片坐标系转换为WGS坐标系
 */
export function transformOfflineToWgsCoord(offlineCoord) {
  if (typeof offlineCoord[0] == "string")
    offlineCoord[0] = parseFloat(offlineCoord[0]);
  if (typeof offlineCoord[1] == "string")
    offlineCoord[1] = parseFloat(offlineCoord[1]);
  let destCoord = coordFromOffset(offlineCoord);
  let baiduCoordinate = olTransform3857To4326(destCoord);
  let gcjCoord = GPSTool.bd_decrypt(baiduCoordinate);
  let wgsCoord = GPSTool.gcj_decrypt(gcjCoord);
  return wgsCoord;
}

/**
 * 将WGS坐标系转换为百度瓦片坐标系
 */
export function transformWgsToBaiduCoord(wgsCoord) {
  if (typeof wgsCoord[0] == "string")
    wgsCoord[0] = parseFloat(wgsCoord[0]);
  if (typeof wgsCoord[1] == "string")
    wgsCoord[1] = parseFloat(wgsCoord[1]);
  let gcjCoord = GPSTool.gcj_encrypt(wgsCoord);
  let baiduCoord = GPSTool.bd_encrypt(gcjCoord);
  return baiduCoord;
}

/**
 * 将百度瓦片坐标系转换为WGS坐标系
 */
export function transformbaiduToWgsCoord(baiduCoord) {
  if (typeof baiduCoord[0] == "string")
    baiduCoord[0] = parseFloat(baiduCoord[0]);
  if (typeof baiduCoord[1] == "string")
    baiduCoord[1] = parseFloat(baiduCoord[1]);
  let gcjCoord = GPSTool.bd_decrypt(baiduCoord);
  let wgsCoord = GPSTool.gcj_decrypt(gcjCoord);
  return wgsCoord;
}

/**
 * 将国测局坐标系转换为2.5D坐标系
 */
export function transformGcjToDimension25Coord(gcjCoord) {
  if (typeof gcjCoord[0] == "string")
    gcjCoord[0] = parseFloat(gcjCoord[0]);
  if (typeof gcjCoord[1] == "string")
    gcjCoord[1] = parseFloat(gcjCoord[1]);
  let coord3857 = olTransform4326To3857(gcjCoord);
  let coordDimension25 = getDimension25FromWeb3857(coord3857);
  return coordDimension25;
}

/**
 * 将2.5D坐标系转换为国测局坐标系
 */
export function transformDimension25ToGcjCoord(coordDimension25) {
  if (typeof coordDimension25[0] == "string")
    coordDimension25[0] = parseFloat(coordDimension25[0]);
  if (typeof coordDimension25[1] == "string")
    coordDimension25[1] = parseFloat(coordDimension25[1]);
  let coord3857 = getWeb3857fromDimension25(coordDimension25)
  let gcjCoord = olTransform3857To4326(coord3857);
  return gcjCoord;
}

const extent_left = -20037508.342789244;
const extent_right = 20037508.342789244;
const extent_top = 20037508.342789244;
const extent_bottom = -20037508.342789244;
const extentWidth = extent_right - extent_left;
const extentHeight = extent_top - extent_bottom;

/**
 * 根据地图级别和坐标，确定所在瓦片的编号
 *
 */
export function getTileGridNumber(level, coord_x, coord_y) {
  let tileCutCount = Math.pow(2, level);
  let beta = Math.floor((coord_x - extent_left) / (extentWidth / tileCutCount));
  let gamma = Math.floor((coord_y - extent_top) / (extentHeight / tileCutCount));
  return [beta, gamma];
}

export function getSingleTileGridExtent(level, grid_x, grid_y) {
  let tileCutCount = Math.pow(2, level);
  let tileLeft = extent_left + extentWidth / tileCutCount * grid_x;
  let tileRight = extent_left + extentWidth / tileCutCount * (grid_x + 1);
  let tileBottom = extent_top + extentHeight / tileCutCount * grid_y;
  let tileTop = extent_top + extentHeight / tileCutCount * (grid_y + 1);
  return [tileLeft, tileBottom, tileRight, tileTop];
}

export function transformEPSG4326To3857(coord4326) {
  if (typeof coord4326[0] == "string")
    coord4326[0] = parseFloat(coord4326[0]);
  if (typeof coord4326[1] == "string")
    coord4326[1] = parseFloat(coord4326[1]);
  return olTransform4326To3857(coord4326);
};
export function transformEPSG3857To4326(coord3857) {
  if (typeof coord3857[0] == "string")
    coord3857[0] = parseFloat(coord3857[0]);
  if (typeof coord3857[1] == "string")
    coord3857[1] = parseFloat(coord3857[1]);
  return olTransform3857To4326(coord3857);
};

/**
 * 将百度坐标系转换为2.5D坐标系
 */
export function transformBaiduToDimension25Coord(baiduCoord) {
  if (typeof baiduCoord[0] == "string")
    baiduCoord[0] = parseFloat(baiduCoord[0]);
  if (typeof baiduCoord[1] == "string")
    baiduCoord[1] = parseFloat(baiduCoord[1]);
  let gcjCoord = GPSTool.bd_decrypt(baiduCoord);
  let coord3857 = olTransform4326To3857(gcjCoord);
  let coordDimension25 = getDimension25FromWeb3857(coord3857);
  return coordDimension25;
}

/**
 * 将2.5D坐标系转换为百度坐标系
 */
export function transformDimension25ToBaiduCoord(coordDimension25) {
  if (typeof coordDimension25[0] == "string")
    coordDimension25[0] = parseFloat(coordDimension25[0]);
  if (typeof coordDimension25[1] == "string")
    coordDimension25[1] = parseFloat(coordDimension25[1]);
  let coord3857 = getWeb3857fromDimension25(coordDimension25)
  let gcjCoord = olTransform3857To4326(coord3857);
  let baiduCoord = GPSTool.bd_encrypt(gcjCoord);
  return baiduCoord;
}

/**
 * 获取车辆航向角（顺时针方向）转换为2.5D地图视角方向相对于正北方向的夹角（顺时针方向）弧度
 * @param  {Number} rotateDeg 车辆航向角（顺时针方向）角度制
 * @return {Number}           夹角（顺时针方向）弧度制
 */
export function getRotateRadDimension25(rotateDeg) {
  let realDeg = -(rotateDeg - 90);
  let realRad = Math.PI * realDeg / 180;
  let realDimension25Rad = Math.atan2(Math.sin(realRad) - Math.cos(realRad), Math.sqrt(2) * (Math.sin(realRad) + Math.cos(realRad)));
  return -realDimension25Rad + Math.PI / 2;
}

export function getRotateDegDimension25(rotateDeg) {
  let resultDimension25Rad = getRotateRadDimension25(rotateDeg);
  let resultDimension25Deg = resultDimension25Rad * 180 / Math.PI;
  return resultDimension25Deg;
}

/**
 * 计算点到线段的最短距离
 * @param  {Number} point_x    待计算点x轴坐标
 * @param  {Number} point_y    待计算点y轴坐标
 * @param  {Number} segmentA_x 线段A点x轴坐标
 * @param  {Number} segmentA_y 线段A点y轴坐标
 * @param  {Number} segmentB_x 线段B点x轴坐标
 * @param  {Number} segmentB_y 线段B点y轴坐标
 * @return {Number}            距离
 */
export function distanceMinBetweenPointAndSegment(point_x, point_y, segmentA_x, segmentA_y, segmentB_x, segmentB_y) {
  // C点为向量AP在向量AB上的投影点，product_ap_ab为向量AP与向量AB的内积，相当于|AC|*|AB|
  let product_ap_ab = (point_x - segmentA_x) * (segmentB_x - segmentA_x) + (point_y - segmentA_y) * (segmentB_y - segmentA_y);
  let product_ab_ab = (segmentB_x - segmentA_x) * (segmentB_x - segmentA_x) + (segmentB_y - segmentA_y) * (segmentB_y - segmentA_y);
  let r = product_ap_ab / product_ab_ab;
  if (isNaN(r))
    return 0;
  if (r >= 1) {
    return Math.sqrt((point_x - segmentB_x) * (point_x - segmentB_x) + (point_y - segmentB_y) * (point_y - segmentB_y));
  } else if (r <= 0) {
    return Math.sqrt((point_x - segmentA_x) * (point_x - segmentA_x) + (point_y - segmentA_y) * (point_y - segmentA_y));
  } else {
    let vector_ac_X = r * (segmentB_x - segmentA_x);
    let vector_ac_Y = r * (segmentB_y - segmentA_y);
    let vector_cp_X = point_x - segmentA_x - vector_ac_X;
    let vector_cp_Y = point_y - segmentA_y - vector_ac_Y;
    return Math.sqrt(vector_cp_X * vector_cp_X + vector_cp_Y * vector_cp_Y);
  }
}
/**
 * 计算点到线段的最短距离
 * @param  {Array} pointCoord    待计算点坐标
 * @param  {Array} segmentCoordA 线段点A坐标
 * @param  {Array} segmentCoordB 线段点B坐标
 * @return {Number}               距离
 */
export function distanceMinBetweenPointSegment(pointCoord, segmentCoordA, segmentCoordB) {
  return distanceMinBetweenPointAndSegment(pointCoord[0], pointCoord[1], segmentCoordA[0], segmentCoordA[1], segmentCoordB[0], segmentCoordB[1]);
};
/**
 * 点到线段的最短距离投影点
 * @param  {Number} point_x    待计算点x轴坐标
 * @param  {Number} point_y    待计算点y轴坐标
 * @param  {Number} segmentA_x 线段A点x轴坐标
 * @param  {Number} segmentA_y 线段A点y轴坐标
 * @param  {Number} segmentB_x 线段B点x轴坐标
 * @param  {Number} segmentB_y 线段B点y轴坐标
 * @return {Array}            投影点坐标
 */
export function projectionFromPointToSegment(point_x, point_y, segmentA_x, segmentA_y, segmentB_x, segmentB_y) {
  let product_ap_ab = (point_x - segmentA_x) * (segmentB_x - segmentA_x) + (point_y - segmentA_y) * (segmentB_y - segmentA_y);
  let product_ab_ab = (segmentB_x - segmentA_x) * (segmentB_x - segmentA_x) + (segmentB_y - segmentA_y) * (segmentB_y - segmentA_y);
  let r = product_ap_ab / product_ab_ab;
  if (isNaN(r))
    return [segmentB_x, segmentB_y];
  if (r >= 1) {
    return [segmentB_x, segmentB_y];
  } else if (r <= 0) {
    return [segmentA_x, segmentA_y];
  } else {
    let vector_ac_X = r * (segmentB_x - segmentA_x);
    let vector_ac_Y = r * (segmentB_y - segmentA_y);
    let point_c_x = segmentA_x + vector_ac_X;
    let point_c_y = segmentA_y + vector_ac_Y;
    return [point_c_x, point_c_y];
  }
};
/**
 * 点到线段的最短距离投影点
 * @param  {Array} pointCoord    待计算点坐标
 * @param  {Array} segmentCoordA 线段点A坐标
 * @param  {Array} segmentCoordB 线段点B坐标
 * @return {Array}               投影点坐标
 */
export function projectionPointToSegment(pointCoord, segmentCoordA, segmentCoordB) {
  return projectionFromPointToSegment(pointCoord[0], pointCoord[1], segmentCoordA[0], segmentCoordA[1], segmentCoordB[0], segmentCoordB[1]);
};

/**
 * 计算1系列坐标的显示中心
 * @param  {Array} coords 要计算的坐标集
 * @return {Array}        中心坐标
 */
export function calculateCoordinatesCenter(coords) {
  let x_max = coords[0][0];
  let x_min = x_max;
  let y_max = coords[0][1];
  let y_min = y_max;
  for (let i = 1; i < coords.length; i++) {
    let coord_x = coords[i][0];
    let coord_y = coords[i][1];
    if (x_max < coord_x)
      x_max = coord_x;
    if (x_min > coord_x)
      x_min = coord_x;
    if (y_max < coord_y)
      y_max = coord_y;
    if (y_min > coord_y)
      y_min = coord_y;
  }
  let center_x = (x_max + x_min) / 2;
  let center_y = (y_max + y_min) / 2;
  return [center_x, center_y];
}

export {
  olTransform,
  GPSTool
};
export * from "./assistTool.js";
