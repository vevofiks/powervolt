import './Select.css';

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  id,
  ...props
}) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`select-group ${error ? 'select-group--error' : ''} ${className}`}>
      {label && <label htmlFor={selectId} className="select-group__label">{label}</label>}
      <select id={selectId} className="select-group__select" {...props}>
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select-group__error">{error}</span>}
    </div>
  );
}
