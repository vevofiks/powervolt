import { useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { useDebounce } from '../../hooks/useDebounce';
import './SearchBar.css';

export default function SearchBar({ placeholder = 'Search anything...', onSearch }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="search-bar" id="global-search">
      <HiOutlineSearch className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        aria-label="Search"
      />
      {query && (
        <span className="search-bar__shortcut">ESC</span>
      )}
    </div>
  );
}
