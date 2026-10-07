// Central SEO constants so metadata, sitemap, robots, JSON-LD and OG images
// all speak with one voice. Business facts here are the same ones printed on
// invoices and in the footer (www.shalistone.com, socials, contact).

export const SITE_URL = 'https://www.shalistone.com';

export const SITE_NAME = 'Shalistone';
export const SITE_TAGLINE = 'Kids & Mens Fashion';
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  'Shalistone — premium kids and mens fashion. Adorable, play-ready outfits for ages 0–16, plus curated menswear. Shop online across India or visit us in store.';

// Used in <meta keywords> (minor signal) and as a vocabulary for copy.
export const SITE_KEYWORDS = [
  'Shalistone',
  'kids fashion',
  'kids clothing',
  'boys wear',
  'kids wear India',
  'childrens clothing',
  'kids outfits 0-16',
  'toddler clothes',
  'ethnic wear for kids',
  'mens fashion',
  'online kids clothing store',
];

export const SITE_CONTACT = {
  email: 'theshalistone@gmail.com',
  phone: '+91 91104 15639',
};

// Public social profiles — drive schema.org `sameAs` and the Twitter card.
export const SOCIAL = {
  instagram: 'https://www.instagram.com/shalistone/',
  facebook: 'https://www.facebook.com/share/1Bzv5BfGng/?mibextid=wwXIfr',
  youtube: 'https://youtube.com/@shalistoneboyswear',
};

export const SOCIAL_SAME_AS = [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube];

// Absolute URL to the brand logo (JSON-LD and OG need absolute URLs).
export const LOGO_URL = `${SITE_URL}/logo.jpeg`;

// Build an absolute URL from a site-relative path.
export const absoluteUrl = (path = '/') =>
  path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
