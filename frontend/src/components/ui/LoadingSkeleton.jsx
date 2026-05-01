import './LoadingSkeleton.css';

export default function LoadingSkeleton({ width = '100%', height = '20px', count = 1, rounded = false }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${rounded ? 'skeleton--rounded' : ''}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
}
