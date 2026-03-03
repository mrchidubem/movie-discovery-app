import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-4 sm:right-6 z-40 rounded-full bg-secondary p-3 text-white shadow-lg hover:bg-secondary/90 transition-all hover:scale-110 md:hidden"
      aria-label="Back to top"
    >
      <FaArrowUp size={20} />
    </button>
  );
};

export default BackToTop;
