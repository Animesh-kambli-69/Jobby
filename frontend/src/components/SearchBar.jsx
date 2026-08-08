import { Search } from 'lucide-react';
import './SearchBar.css';

function SearchBar({ value, onChange, onSearch, placeholder }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder || "Search jobs by title, skills, or keywords..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary search-btn">
        Search
      </button>
    </form>
  );
}

export default SearchBar;
