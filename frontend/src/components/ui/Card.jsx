import './Card.css';

export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div className={`card ${padding ? 'card--padded' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
