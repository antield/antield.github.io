import 'ol/ol.css';
import {
  Map,
  View
} from 'ol';
import TileLayer from 'ol/layer/Tile';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZSource from 'ol/source/XYZ';
import TileDebug from 'ol/source/TileDebug';

export function createBaiduTileMap(elementId, debugTileLayerName) {
  let mapInstanceConfig = mapConfig.muckTruck;
  let mapTileSource = new XYZSource({ // 瓦片资源source
    tileUrlFunction: mapInstanceConfig.tileUrlFunction,
    wrapX: false,
  });
  let mapTileLayer = new TileLayer({
    source: mapTileSource
  });

  let olMap = new Map({
    target: elementId,
    layers: [mapTileLayer],
    view: new View({
      constrainResolution: true,
      //extent: mapInstanceConfig.mapExtent,
      center: mapInstanceConfig.mapCenter,
      zoom: mapInstanceConfig.zoom,
      minZoom: mapInstanceConfig.minZoom,
      maxZoom: mapInstanceConfig.maxZoom
    }),
  });

  if (debugTileLayerName != undefined && debugTileLayerName.length > 0) {
    let debugGridLayer = new TileLayer({
      source: new TileDebug({
        projection: 'EPSG:3857',
        tileGrid: mapTileSource.getTileGrid()
      })
    });
    debugGridLayer.setVisible(false);
    window[debugTileLayerName] = debugGridLayer;
    olMap.addLayer(debugGridLayer);
  }

  return olMap;
}

export function createZhongzhi25dMap(elementId, debugTileLayerName) {
  let mapInstanceConfig = mapConfig.zhongzhi25d;
  let mapTileSource = new XYZSource({ // 瓦片资源source
    tileUrlFunction: mapInstanceConfig.tileUrlFunction,
    wrapX: false,
  });
  let mapTileLayer = new TileLayer({
    source: mapTileSource
  });

  let olMap = new Map({
    target: elementId,
    layers: [mapTileLayer],
    view: new View({
      constrainResolution: true,
      //extent: mapInstanceConfig.mapExtent,
      center: mapInstanceConfig.mapCenter,
      zoom: mapInstanceConfig.zoom,
      minZoom: mapInstanceConfig.minZoom,
      maxZoom: mapInstanceConfig.maxZoom
    }),
  });

  if (debugTileLayerName != undefined && debugTileLayerName.length > 0) {
    let debugGridLayer = new TileLayer({
      source: new TileDebug({
        projection: 'EPSG:3857',
        tileGrid: mapTileSource.getTileGrid()
      })
    });
    debugGridLayer.setVisible(false);
    window[debugTileLayerName] = debugGridLayer;
    olMap.addLayer(debugGridLayer);
  }

  return olMap;
}
