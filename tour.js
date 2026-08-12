import { Viewer } from '@photo-sphere-viewer/core';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

const pano = (name) => `assets/panos/${name}.jpg`;
const thumb = (name) => `assets/thumbs/${name}.jpg`;

// Fallback view per scene, used on the first load and for gallery jumps
// (arrivals through a door face the direction of travel instead — see
// transitionOptions below).
const DEFAULT_VIEWS = {
  entrance: { yaw: rad(30), pitch: 0 },
  frontdesk: { yaw: rad(-150), pitch: 0 },
  tensionboard: { yaw: rad(108), pitch: 0 },
  garage: { yaw: rad(-90), pitch: 0 },
  back: { yaw: rad(-20), pitch: 0 },
  closet: { yaw: rad(-90), pitch: 0 },
};

function rad(deg) {
  return (deg * Math.PI) / 180;
}

// Link yaw/pitch values are calibrated against on-screen angle rulers —
// each arrow sits on the floor of the passage it leads through.
const NODES = [
  {
    id: 'entrance',
    panorama: pano('RipEntrance'),
    thumbnail: thumb('RipEntrance'),
    name: 'Entrance',
    caption: 'Entrance — Welcome to Ripple Boulder',
    links: [
      { nodeId: 'tensionboard', position: { yaw: rad(-80), pitch: rad(-8) } },
      { nodeId: 'frontdesk', position: { yaw: rad(4), pitch: rad(-13) } },
      { nodeId: 'garage', position: { yaw: rad(128), pitch: rad(-8) } },
    ],
  },
  {
    id: 'frontdesk',
    panorama: pano('Frontdesk'),
    thumbnail: thumb('Frontdesk'),
    name: 'Front Desk',
    caption: 'Front Desk — Check in & rentals',
    links: [
      { nodeId: 'entrance', position: { yaw: rad(-162), pitch: rad(-8) } },
      { nodeId: 'tensionboard', position: { yaw: rad(-120), pitch: rad(-8) } },
      { nodeId: 'back', position: { yaw: rad(38), pitch: rad(-18) } },
      { nodeId: 'garage', position: { yaw: rad(160), pitch: rad(-6) } },
    ],
  },
  {
    id: 'tensionboard',
    panorama: pano('Tensionboard'),
    thumbnail: thumb('Tensionboard'),
    name: 'Tension Board',
    caption: 'Tension Board — Training area',
    links: [
      { nodeId: 'frontdesk', position: { yaw: rad(-11), pitch: rad(-11) } },
      { nodeId: 'entrance', position: { yaw: rad(52), pitch: rad(-8) } },
    ],
  },
  {
    id: 'garage',
    panorama: pano('Garage'),
    thumbnail: thumb('Garage'),
    name: 'Garage',
    caption: 'Garage — Roll-up door & patio',
    links: [
      { nodeId: 'back', position: { yaw: rad(-118), pitch: rad(-8) } },
      { nodeId: 'tensionboard', position: { yaw: rad(163), pitch: rad(-6) } },
      { nodeId: 'frontdesk', position: { yaw: rad(175), pitch: rad(-6) } },
    ],
  },
  {
    id: 'back',
    panorama: pano('Back'),
    thumbnail: thumb('Back'),
    name: 'Back Wall',
    caption: 'Back Wall — Bouldering room',
    links: [
      { nodeId: 'closet', position: { yaw: rad(18), pitch: rad(-10) } },
      { nodeId: 'tensionboard', position: { yaw: rad(142), pitch: rad(-6) } },
      { nodeId: 'frontdesk', position: { yaw: rad(152), pitch: rad(-8) } },
    ],
  },
  {
    id: 'closet',
    panorama: pano('Closet'),
    thumbnail: thumb('Closet'),
    name: 'The Closet',
    caption: 'The Closet — Back corner walls',
    links: [
      { nodeId: 'back', position: { yaw: rad(-62), pitch: rad(-10) } },
    ],
  },
];

// Arriving at `toNode` from `fromNode`: keep walking in the direction of
// travel, i.e. face away from the door you just came through (the reverse
// of toNode's return link). Falls back to the scene's default view.
function arrivalView(toNode, fromNode) {
  // The tension board is a dead-end attraction — always arrive facing the board.
  if (toNode.id === 'tensionboard') {
    return DEFAULT_VIEWS.tensionboard;
  }
  const backLink = fromNode && toNode.links.find((l) => l.nodeId === fromNode.id);
  if (backLink) {
    let yaw = backLink.position.yaw + Math.PI;
    if (yaw > Math.PI) yaw -= 2 * Math.PI;
    return { yaw, pitch: 0 };
  }
  return DEFAULT_VIEWS[toNode.id];
}

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
      renderMode: '2d',
      startNodeId: 'entrance',
      preload: true,
      nodes: NODES,
      transitionOptions: (toNode, fromNode) => ({
        speed: 1000,
        effect: 'fade',
        rotation: true,
        rotateTo: arrivalView(toNode, fromNode),
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
