// Room icon management module
import { config } from './config.js';

/**
 * Maps room names to their corresponding Font Awesome icon classes
 * @type {Object}
 */
const roomIconMap = {
  'Studio': 'fa-image-music',
  'Lounge': 'fa-couch',
  'Bedroom': 'fa-bed-front',
  'Servers': 'fa-server',
  // Add more mappings as needed
};

/**
 * Updates the room icon based on the room name
 * @param {string} prefix - Room prefix (e.g., 'secondary', 'tertiary')
 * @param {string} roomName - The name of the room
 */
function updateRoomIcon(prefix, roomName) {
  if (!prefix || !roomName) return;

  const iconElement = document.getElementById(`${prefix}-room-icon`);
  if (!iconElement) {
    console.error(`Room icon element not found for prefix: ${prefix}`);
    return;
  }

  // Remove any existing icon class (except the base classes)
  const baseClasses = ['room-icon', 'fa-duotone', 'fa-regular'];
  const currentClasses = Array.from(iconElement.classList);
  
  currentClasses.forEach(className => {
    if (!baseClasses.includes(className) && className.startsWith('fa-')) {
      iconElement.classList.remove(className);
    }
  });

  // Find the matching icon class for the room name
  let iconClass = roomIconMap[roomName];
  
  // If no exact match, try case-insensitive matching
  if (!iconClass) {
    const lowerRoomName = roomName.toLowerCase();
    for (const [key, value] of Object.entries(roomIconMap)) {
      if (key.toLowerCase() === lowerRoomName) {
        iconClass = value;
        break;
      }
    }
  }

  // If still no match, check if the room name contains any of the keys
  if (!iconClass) {
    for (const [key, value] of Object.entries(roomIconMap)) {
      if (roomName.toLowerCase().includes(key.toLowerCase())) {
        iconClass = value;
        break;
      }
    }
  }

  // Default to border-none if no match found
  if (!iconClass) {
    iconClass = 'fa-border-none';
  }

  // Add the appropriate icon class
  iconElement.classList.add(iconClass);
  console.log(`Updated ${prefix} room icon to ${iconClass} for room: ${roomName}`);
}

export {
  updateRoomIcon
};
