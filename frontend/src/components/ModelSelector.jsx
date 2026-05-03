import React from 'react';
import './ModelSelector.css';

const ModelSelector = ({ selectedModel, setSelectedModel }) => {
  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gemma', name: 'Gemma 7B (OpenRouter)' },
    { id: 'minimax', name: 'Minimax (OpenRouter)' },
    { id: 'qwen', name: 'Qwen 2 72B (OpenRouter)' }
  ];

  return (
    <div className="model-selector-container">
      <label htmlFor="model-select" className="model-label">Model:</label>
      <div className="select-wrapper">
        <select 
          id="model-select" 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-select"
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector;
