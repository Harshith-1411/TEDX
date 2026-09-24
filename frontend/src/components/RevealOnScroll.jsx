import useScrollReveal from '../hooks/useScrollReveal';
import './RevealOnScroll.css';

function RevealOnScroll({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
  threshold,
  rootMargin,
}) {
  const { ref, visible } = useScrollReveal({ threshold, rootMargin });

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

export default RevealOnScroll;
