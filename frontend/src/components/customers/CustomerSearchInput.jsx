import { useState, useEffect, useRef } from 'react';
import { HiOutlineUserAdd } from 'react-icons/hi';
import { useDebounce } from '../../hooks/useDebounce';
import { customerApi } from '../../api/customers';
import '../products/ProductSearchInput.css'; // Reuse product search styling

export default function CustomerSearchInput({ value, onSelect, onQuickAdd, onChange, hasError, label }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (debouncedQuery.length >= 1 && showDropdown) {
      fetchResults(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await customerApi.getAll({ search: searchQuery });
      setResults(res.data?.items || []);
      setActiveIndex(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    if (onChange) onChange(val);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelect = (customer) => {
    setQuery(customer.name);
    setShowDropdown(false);
    onSelect(customer);
  };

  const highlightText = (text, highlight) => {
    if (!text || !highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="highlight">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="product-search-wrapper" ref={wrapperRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label className="input-label" style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text)' }}>{label}</label>}
      <div className="product-input-row" style={{ height: '42px' }}>
        <input
          ref={inputRef}
          type="text"
          className={`item-input ${hasError ? 'input-error' : ''}`}
          style={{ height: '100%', padding: '0 12px' }}
          placeholder="Search by Customer Name or Phone..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length > 0) setShowDropdown(true); }}
          autoComplete="off"
        />
        <button
          type="button"
          className="quick-add-btn"
          style={{ height: '100%' }}
          onClick={onQuickAdd}
          title="Add detailed customer"
        >
          <HiOutlineUserAdd />
          <span>New</span>
        </button>
      </div>

      {showDropdown && query.length > 0 && (
        <div className="product-dropdown" style={{ minWidth: '100%' }}>
          {loading ? (
            <div className="dropdown-msg">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="dropdown-list">
              {results.map((c, index) => (
                <li
                  key={c.id}
                  className={`dropdown-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(c)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="p-header">
                    <span className="p-name">{highlightText(c.name, query)}</span>
                  </div>
                  <div className="p-meta">
                    {c.phone && <span>Phone: {highlightText(c.phone, query)}</span>}
                    {c.city && <span>City: {highlightText(c.city, query)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dropdown-msg">
              No customers found. <span className="add-link" onClick={onQuickAdd}>Add new?</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
