import React from 'react';

const SEO = ({ title, description, image, url, type = 'website' }) => {
  React.useEffect(() => {
    // Update document title
    document.title = title ? `${title} | Movie Discovery` : 'Movie Discovery - Find & Share Your Favorite Movies';

    // Update meta tags
    updateMetaTag('description', description || 'Discover, rate, and share your favorite movies. Find where to watch them on Netflix, Amazon Prime, and more.');
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image || '/og-image.png');
    updateMetaTag('og:url', url || window.location.href);
    updateMetaTag('og:type', type);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:card', 'summary_large_image');
  }, [title, description, image, url, type]);

  return null;
};

function updateMetaTag(name, content) {
  if (!content) return;

  let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  
  if (!tag) {
    tag = document.createElement('meta');
    const property = name.includes('og:') || name.includes('twitter:') ? 'property' : 'name';
    tag.setAttribute(property, name);
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
}

export default SEO;
