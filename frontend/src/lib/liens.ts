/** Construction des liens à partir des coordonnées éditables. */

/** Fichier du dossier public (logos, pictogrammes) : préfixé par /app/ une fois le site construit. */
export const asset = (fichier: string) => `${import.meta.env.BASE_URL}assets/${fichier}`;

const chiffres = (numero: string) => numero.replace(/[^\d+]/g, '');

export const lienTelephone = (numero: string) => `tel:${chiffres(numero)}`;

export const lienWhatsApp = (numero: string, message?: string) =>
  `https://wa.me/${chiffres(numero).replace(/^\+/, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const lienEmail = (email: string) => `mailto:${email}`;

export const lienItineraire = (adresse: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;

export const lienCarte = (latitude: string, longitude: string) => {
  const [lat, lng] = [Number(latitude), Number(longitude)];
  const bbox = [lng - 0.03, lat - 0.02, lng + 0.03, lat + 0.02].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
};
