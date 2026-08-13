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
  garage: { yaw: rad(100), pitch: 0 },
  back: { yaw: rad(-20), pitch: 0 },
  closet: { yaw: rad(200), pitch: 0 },
};

function rad(deg) {
  return (deg * Math.PI) / 180;
}

// Each arrow sits on the floor in the direction you would walk to reach that
// station — in the doorway itself where one separates the two.
//
// Yaw/pitch are calibrated with higgsfield-fix/aim.py, which renders the
// panorama view each link points at with a crosshair on its exact aim, and
// higgsfield-fix/strip.py, which renders a yaw-labelled strip so a landmark's
// bearing can be read off directly. Where a station is not visible from another
// (the garage bay and the tension board cannot see each other), the bearing is
// triangulated from landmarks both panoramas do share.
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
      // The roll-up door is immediately left of the entrance storefront and
      // largely hidden behind a leaning crash pad — its overhead track and
      // operator give it away. Easy to mistake the two; 68 put this arrow out
      // on the entrance glass, reading as "outside".
      { nodeId: 'garage', position: { yaw: rad(37), pitch: rad(-8) } },
    ],
  },
  {
    id: 'garage',
    panorama: pano('Garage'),
    thumbnail: thumb('Garage'),
    name: 'Garage',
    caption: 'Garage — Roll-up door & patio',
    links: [
      { nodeId: 'tensionboard', position: { yaw: rad(158), pitch: rad(-7) } },
      { nodeId: 'entrance', position: { yaw: rad(174), pitch: rad(-7) } },
      // The way to the closet is the white panel door in the alcove between the
      // climbing walls, not around the orange overhang — confirmed by the user.
      { nodeId: 'closet', position: { yaw: rad(257), pitch: rad(-12) } },
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
      // Aimed across the room at the glass roll-up door rather than at the panel
      // door you actually walk through — the user's call, it reads better.
      { nodeId: 'garage', position: { yaw: rad(204), pitch: rad(-6) } },
      // Out through the recessed bay with the pale plywood wall, not past the
      // overhang by the cubby boxes — confirmed by the user.
      { nodeId: 'back', position: { yaw: rad(295), pitch: rad(-12) } },
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
