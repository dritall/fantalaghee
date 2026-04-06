// Utility functions for player data handling

export const getDisplayPlayerName = (p: any) => {
  if (!p) return 'Player';
  const player = p.player || p;
  
  // Ordine: 1. displayName 2. mediaLastName
  let name = player.displayName || player.mediaLastName;
  
  // 3. ultima parte utile di shirtName
  if (!name && player.shirtName) {
    const parts = player.shirtName.split(' ');
    name = parts[parts.length - 1]; // "ultima parte utile"
  }
  
  // 4. shortName fallback
  if (!name) {
    name = player.shortName || player.officialName || 'Player';
  }
  
  // Pulizia
  name = name.replace(/\.\.\./g, '').trim();
  name = name.replace(/^[A-Z]\.\s*/, '').trim(); // "V. Carboni" -> "Carboni"
  name = name.replace(/^[A-Z]\.\.\.\s*\.\s*/, '').trim(); // "V... . Carboni" -> "Carboni"
  
  if (name.length > 20 && name.includes(' ')) {
    const parts = name.split(' ');
    name = parts[parts.length - 1];
  }

  return name;
};

export const getPlayerImageUrl = (p: any, sId?: string, tId?: string, forceSide: string = 'home') => {
  if (!p) return null;

  const keys = Object.keys(p);
  const patterns = [
    'playerImagehomeleft', 'playerImagehomemiddle', 'playerImagehomeceleb',
    'playerImageawayleft', 'playerImageawaymiddle', 'playerImageawayceleb',
  ];

  for (const pattern of patterns) {
    const keyToUse = keys.find(k => k.toLowerCase().startsWith(pattern.toLowerCase()));
    if (keyToUse) {
       let val = p[keyToUse];
       if (typeof val === 'string' && val.includes('.webp')) {
          if (val.startsWith('http')) return val;
          return val.startsWith('/') ? `https://media-sdp.legaseriea.it${val}` : `https://media-sdp.legaseriea.it/${val}`;
       } else if (keyToUse.includes('.webp') && !val) {
          const extracted = keyToUse.substring(pattern.length);
          if (extracted.startsWith('http')) return extracted;
          const urlPath = extracted.startsWith('playerImages') ? `/${extracted}` : extracted;
          return urlPath.startsWith('/') ? `https://media-sdp.legaseriea.it${urlPath}` : `https://media-sdp.legaseriea.it/${urlPath}`;
       }
    }
  }

  const imgFields = ['image', 'photo', 'pictureUrl', 'imageUrl'];
  const checkFields = (obj: any) => {
    for (const f of imgFields) {
      if (typeof obj[f] === 'string' && obj[f].includes('.webp')) {
         if (obj[f].startsWith('http')) return obj[f];
         return obj[f].startsWith('/') ? `https://media-sdp.legaseriea.it${obj[f]}` : `https://media-sdp.legaseriea.it/${obj[f]}`;
      }
    }
    return null;
  };

  const found = checkFields(p) || (p.details && checkFields(p.details));
  if (found) return found;

  const pId = (p.playerId || p.id || '')?.split('::').pop();
  if (sId && tId && pId) {
    return `https://media-sdp.legaseriea.it/playerImages/ec93b94f74294dc98ab5bcfd67fc0d88/${sId}/${tId}/${forceSide}/${pId}left.webp`;
  }
  return null;
};
