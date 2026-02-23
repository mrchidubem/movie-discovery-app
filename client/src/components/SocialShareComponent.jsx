import { FaFacebook, FaTwitter, FaWhatsapp, FaLink, FaCheck } from 'react-icons/fa';
import { useState } from 'react';

const SocialShareComponent = ({ movie }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/movie/${movie.id}`;
  const shareText = `Check out "${movie.title}" on MovieVerse! ⭐`;

  const handleShare = (platform) => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-bold">📤 Share This Movie</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 rounded-lg bg-blue-400 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          <FaTwitter /> Twitter
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          <FaFacebook /> Facebook
        </button>
        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
        >
          <FaWhatsapp /> WhatsApp
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
        >
          {copied ? <><FaCheck /> Copied!</> : <><FaLink /> Copy Link</>}
        </button>
      </div>
    </div>
  );
};

export default SocialShareComponent;
