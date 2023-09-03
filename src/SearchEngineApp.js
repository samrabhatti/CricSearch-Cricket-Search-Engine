import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './SearchEngineApp.css';

function TitlePage({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="title-page">
      <h1>Cricket Search Engine</h1>
      <form onSubmit={handleSubmit} className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          class="search-input"
          id="search-input" 
          placeholder="Enter your search query"
        />
        <button class="search-button" type="submit">
          <img class="search-icon" src="search-icon.png" alt="Search" height="25px" width="25px"></img>
          Search
        </button>
      </form>
    </div>
  );
}

function ResultsPage({onSearch, results, searchTime}) {
  const totalResults = results.length;
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="results-page">

      <div className="results-search-container">
      <form onSubmit={handleSubmit} className="results-search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          class="results-search-input"
          id="search-input" 
          placeholder="Enter your search query"
        />
        <button class="results-search-button" type="submit">
          <img class="search-icon" src="search-icon.png" alt="Search" height="25px" width="25px"></img>
          Search
        </button>
      </form>
      </div>

        <div className="search-results">
        <h2>Your Search Results:</h2>
        <p>Search Time Elapsed: {searchTime}ms</p>
        <p>Total Results: {totalResults}</p>

        {totalResults === 0 ? (
          <p color='red'>No results found.</p>
        ) : (
          results.map((item) => (
            <div key={item.id} className="result-item">
              <p className='username'>@ {item.username}</p>
              <p>{item.text}</p>
              <p className='icons'>
                  <img src='https://viplikes.net/img/catalog_sect_img/new/TWITTER%20LIKES.png' height="30px" width="30px"></img>&nbsp;<span className="like-count">{item.likecount} &nbsp;</span>
                  <img src='https://viplikes.net/img/catalog_sect_img/new/TWITTER%20COMMENTS.png' height="30px" width="30px"></img>&nbsp;<span className="reply-count">{item.replycount} &nbsp;</span>
                  <img src='https://viplikes.net/img/catalog_sect_img/new/TWITTER%20re-tweets.png' height="30px" width="30px"></img>&nbsp;<span className="retweet-count">{item.retweetcount} &nbsp;</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SearchEngineApp() {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState('https://media.istockphoto.com/id/1403884032/photo/india-vs-pakistan-cricket-balls-with-flag.jpg?s=612x612&w=0&k=20&c=kdQPy0ijYzcSE084lAHcoubpaiPJywFgDqAoAPzF5g8=');
  const [searchTime, setSearchTime] = useState(0);
  const [documentFrequencies, setDocumentFrequencies] = useState({});
  const [inverseDocumentFrequencies, setInverseDocumentFrequencies] = useState({});
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    Papa.parse('Preprocessed-Data-10k.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setData(results.data);
      },
    });
  }, []);

  useEffect(() => {
    preprocessData();
  }, [data]);
  
  const preprocessData = () => {
    const docFreqs = {};
    const invDocFreqs = {};

    data.forEach((document) => {
      const words = document.text.toLowerCase().split(" ");

      const uniqueWords = new Set(words);
      uniqueWords.forEach((word) => {
        if (!docFreqs[word]) {
          docFreqs[word] = 0;
        }
        docFreqs[word] += 1;
      });
    });

    const numDocuments = data.length;
    Object.keys(docFreqs).forEach((term) => {
      const documentFrequency = docFreqs[term];
      invDocFreqs[term] = Math.log(numDocuments / (documentFrequency + 1));
    });

    setDocumentFrequencies(docFreqs);
    setInverseDocumentFrequencies(invDocFreqs);
  };

  const searchDocuments = (searchTerm) => {
    const searchTerms = searchTerm.toLowerCase().split(' ');

    const filteredResults = data.filter((item) => {
      const terms = item.text.toLowerCase().split(' ');
    
      return searchTerms.every((searchTerm) => terms.includes(searchTerm));
    });

    const results = filteredResults.map((item) => {
    const tfidfScores = {};

    const terms = item.text.toLowerCase().split(' ');
  
      terms.forEach((term) => {
        const termFrequency = calculateTermFrequency(term, terms);
        const inverseDocumentFrequency = inverseDocumentFrequencies[term] || 0;
        const tfidfScore = termFrequency * inverseDocumentFrequency;
  
        tfidfScores[term] = tfidfScore;
      });
  
      return {
        ...item,
        tfidfScores,
      };
    });
  
    results.sort((a, b) => {
      const aScore = calculateCombinedTFIDF(a.tfidfScores, searchTerms);
      const bScore = calculateCombinedTFIDF(b.tfidfScores, searchTerms);
  
      return bScore - aScore;
    });
  
   return results;
  };  

  const calculateTermFrequency = (term, terms) => {
    const termCount = terms.filter((t) => t === term).length;
    const termFrequency = termCount / terms.length;

    return termFrequency;
  };

  const calculateCombinedTFIDF = (tfidfScores, searchTerms) => {
    let combinedTFIDF = 0;

    searchTerms.forEach((term) => {
      const tfidfScore = tfidfScores[term] || 0;
      combinedTFIDF += tfidfScore;
    });
    return combinedTFIDF;
  };

  const handleSearch = (searchTerm) => {
    const startTime = new Date().getTime();
    const results = searchDocuments(searchTerm);
    const endTime = new Date().getTime();
  
    setResults(results);
    setSearchTime(endTime - startTime);
    setBackgroundImage('https://i.pinimg.com/736x/b1/28/d4/b128d47ea57eca6fb1278aad1e3a474d.jpg');
  };

  return (
    <div className="background-image" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {results.length === 0 ? (
        <TitlePage onSearch={handleSearch} />
      ) : (
        <div className="background-image" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <ResultsPage onSearch={handleSearch} results={results} searchTime={searchTime} />
        </div>
      )}
    </div>
  );
}

export default SearchEngineApp;
