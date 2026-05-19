import { useState, useEffect, useRef } from 'react';
import { HiOutlineCube } from 'react-icons/hi';
import { useDebounce } from '../../hooks/useDebounce';
import { productApi } from '../../api/products';
import './ProductSearchInput.css';

export default function ProductSearchInput({ value, onSelect, onQuickAdd, onChange, hasError }) {
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
      const res = await productApi.search(searchQuery);
      setResults(res.data || []);
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

  const handleSelect = (product) => {
    setQuery(product.productName);
    setShowDropdown(false);
    onSelect(product);
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
    <div className="product-search-wrapper" ref={wrapperRef}>
      <div className="product-input-row">
        <input
          ref={inputRef}
          type="text"
          className={`item-input ${hasError ? 'input-error' : ''}`}
          placeholder="Search by Name, SKU, HSN..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length > 0) setShowDropdown(true); }}
          autoComplete="off"
        />
        <button
          type="button"
          className="quick-add-btn"
          onClick={onQuickAdd}
          title="Quick add new product"
        >
          <HiOutlineCube />
          <span>New</span>
        </button>
      </div>

      {showDropdown && query.length > 0 && (
        <div className="product-dropdown">
          {loading ? (
            <div className="dropdown-msg">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="dropdown-list">
              {results.map((p, index) => (
                <li
                  key={p.id}
                  className={`dropdown-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="p-header">
                    {p.sku && <span className="p-badge">{highlightText(p.sku, query)}</span>}
                    <span className="p-name">{highlightText(p.productName, query)}</span>
                  </div>
                  <div className="p-meta">
                    {p.hsnCode && <span>HSN: {highlightText(p.hsnCode, query)}</span>}
                    <span>Stock: {p.currentStock} {p.unit || ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dropdown-msg">
              No products found. <span className="add-link" onClick={onQuickAdd}>Add new?</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
