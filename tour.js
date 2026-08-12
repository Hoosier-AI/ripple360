import { Viewer } from '@photo-sphere-viewer/core';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

const pano = (name) => `assets/panos/${name}.jpg`;
const thumb = (name) => `assets/thumbs/${name}.jpg`;

// Where the camera should face when arriving at each scene
const DEFAULT_VIEWS = {
  entrance: { yaw: '30deg', pitch: '0deg' },
  frontdesk: { yaw: '-150deg', pitch: '0deg' },
  tensionboard: { yaw: '108deg', pitch: '0deg' },
  garage: { yaw: '-90deg', pitch: '0deg' },
  back: { yaw: '-90deg', pitch: '0deg' },
  closet: { yaw: '0deg', pitch: '0deg' },
};

const NODES = [
  {
    id: 'entrance',
    panorama: pano('RipEntrance'),
    thumbnail: thumb('RipEntrance'),
    name: 'Entrance',
    caption: 'Entrance — Welcome to Ripple Boulder',
    links: [
      { nodeId: 'tensionboard', position: { yaw: '-79deg', pitch: '-10deg' } },
      { nodeId: 'frontdesk', position: { yaw: '2deg', pitch: '-8deg' } },
      { nodeId: 'garage', position: { yaw: '167deg', pitch: '-5deg' } },
    ],
  },
  {
    id: 'frontdesk',
    panorama: pano('Frontdesk'),
    thumbnail: thumb('Frontdesk'),
    name: 'Front Desk',
    caption: 'Front Desk — Check in & rentals',
    links: [
      { nodeId: 'entrance', position: { yaw: '-153deg', pitch: '-6deg' } },
      { nodeId: 'tensionboard', position: { yaw: '-121deg', pitch: '-8deg' } },
      { nodeId: 'back', position: { yaw: '36deg', pitch: '-6deg' } },
      { nodeId: 'garage', position: { yaw: '148deg', pitch: '-5deg' } },
    ],
  },
  {
    id: 'tensionboard',
    panorama: pano('Tensionboard'),
    thumbnail: thumb('Tensionboard'),
    name: 'Tension Board',
    caption: 'Tension Board — Training area',
    links: [
      { nodeId: 'back', position: { yaw: '-19deg', pitch: '-4deg' } },
      { nodeId: 'frontdesk', position: { yaw: '-2deg', pitch: '-7deg' } },
      { nodeId: 'entrance', position: { yaw: '54deg', pitch: '-8deg' } },
    ],
  },
  {
    id: 'garage',
    panorama: pano('Garage'),
    thumbnail: thumb('Garage'),
    name: 'Garage',
    caption: 'Garage — Roll-up door & patio',
    links: [
      { nodeId: 'back', position: { yaw: '-108deg', pitch: '-5deg' } },
      { nodeId: 'frontdesk', position: { yaw: '158deg', pitch: '-4deg' } },
      { nodeId: 'entrance', position: { yaw: '176deg', pitch: '-4deg' } },
    ],
  },
  {
    id: 'back',
    panorama: pano('Back'),
    thumbnail: thumb('Back'),
    name: 'Back Wall',
    caption: 'Back Wall — Bouldering room',
    links: [
      { nodeId: 'closet', position: { yaw: '15deg', pitch: '-6deg' } },
      { nodeId: 'tensionboard', position: { yaw: '136deg', pitch: '-2deg' } },
      { nodeId: 'frontdesk', position: { yaw: '147deg', pitch: '-7deg' } },
    ],
  },
  {
    id: 'closet',
    panorama: pano('Closet'),
    thumbnail: thumb('Closet'),
    name: 'The Closet',
    caption: 'The Closet — Back corner walls',
    links: [
      { nodeId: 'back', position: { yaw: '-85deg', pitch: '-4deg' } },
    ],
  },
];

const viewer = new Viewer({
  container: 'viewer',
  loadingTxt: 'Loading Ripple Boulder…',
  touchmoveTwoFingers: false,
  mousewheelCtrlKey: false,
  defaultZoomLvl: 0,
  defaultYaw: '30deg',
  navbar: ['zoom', 'move', 'gallery', 'caption', 'fullscreen'],
  plugins: [
    // GalleryPlugin must be registered before VirtualTourPlugin so the tour
    // can populate the gallery with its nodes.
    GalleryPlugin.withConfig({
      visibleOnLoad: true,
      hideOnClick: false,
      thumbnailSize: { width: 100, height: 100 },
    }),
    VirtualTourPlugin.withConfig({
      dataMode: 'client',
      positionMode: 'manual',
      renderMode: '3d',
      startNodeId: 'entrance',
      preload: true,
      nodes: NODES,
      transitionOptions: (toNode) => ({
        speed: '20rpm',
        effect: 'fade',
        rotation: true,
        rotateTo: DEFAULT_VIEWS[toNode.id],
      }),
    }),
    AutorotatePlugin.withConfig({
      autostartDelay: 2500,
      autostartOnIdle: false,
      autorotateSpeed: '0.5rpm',
    }),
  ],
});

// Restart the slow ambient spin each time a new scene loads; any user
// interaction stops it until the next scene.
const tour = viewer.getPlugin(VirtualTourPlugin);
const autorotate = viewer.getPlugin(AutorotatePlugin);

window.__psv = { viewer, tour, autorotate };

tour.addEventListener('node-changed', () => {
  setTimeout(() => autorotate.start(), 2500);
});

// Fade out the usage hint after first interaction (or 8s)
const hint = document.getElementById('hint');
const hideHint = () => hint.classList.add('hidden');
setTimeout(hideHint, 8000);
viewer.addEventListener('click', hideHint, { once: true });
viewer.container.addEventListener('pointerdown', hideHint, { once: true });
