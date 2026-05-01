import './Input.css';

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-group__label">{label}</label>}
      <div className="input-group__wrapper">
        {Icon && <Icon className="input-group__icon" />}
        <input id={inputId} className={`input-group__input ${Icon ? 'input-group__input--icon' : ''}`} {...props} />
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
