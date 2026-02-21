import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import axios from 'axios';
import './Canvas.css';

function Canvas({ user, onLogout }) {
  const [rectangles, setRectangles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [annotationId, setAnnotationId] = useState(null);
  const [autoSave, setAutoSave] = useState(false);
  
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAnnotations();
  }, []);

  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  useEffect(() => {
    if (autoSave && rectangles.length > 0) {
      const timer = setTimeout(() => {
        saveAnnotations();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rectangles, autoSave]);

  const fetchAnnotations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://vecrossbackend.onrender.com/api/annotations', {
        headers: { 'x-auth-token': token }
      });

      if (response.data.length > 0) {
        const latest = response.data[response.data.length - 1];
        setRectangles(latest.rectangles);
        setAnnotationId(latest._id);
      }
    } catch (err) {
      setError('Failed to load annotations');
    } finally {
      setLoading(false);
    }
  };

  const saveAnnotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = { rectangles };

      if (annotationId) {
        await axios.put(`https://vecrossbackend.onrender.com/api/annotations/${annotationId}`, data, {
          headers: { 'x-auth-token': token }
        });
      } else {
        const response = await axios.post('https://vecrossbackend.onrender.com/api/annotations', data, {
          headers: { 'x-auth-token': token }
        });
        setAnnotationId(response.data._id);
      }
      setError('');
    } catch (err) {
      setError('Failed to save annotations');
    }
  };

  const handleMouseDown = (e) => {
    if (!isDrawing || e.target !== stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    const newRect = {
      id: `rect-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
    };
    
    setStartPoint(pos);
    setCurrentRect(newRect);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint || !currentRect) return;

    const pos = stageRef.current.getPointerPosition();
    const newRect = {
      ...currentRect,
      width: pos.x - startPoint.x,
      height: pos.y - startPoint.y,
    };
    
    setCurrentRect(newRect);
  };

  const handleMouseUp = () => {
    if (currentRect && Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
      const finalRect = {
        ...currentRect,
        x: currentRect.width > 0 ? currentRect.x : currentRect.x + currentRect.width,
        y: currentRect.height > 0 ? currentRect.y : currentRect.y + currentRect.height,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height),
      };
      setRectangles([...rectangles, finalRect]);
    }
    
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleDragEnd = (e, id) => {
    const updatedRects = rectangles.map(rect => {
      if (rect.id === id) {
        return {
          ...rect,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return rect;
    });
    setRectangles(updatedRects);
  };

  const handleTransformEnd = (e, id) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const updatedRects = rectangles.map(rect => {
      if (rect.id === id) {
        return {
          ...rect,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, rect.width * scaleX),
          height: Math.max(5, rect.height * scaleY),
        };
      }
      return rect;
    });
    setRectangles(updatedRects);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setRectangles(rectangles.filter(rect => rect.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearAll = () => {
    setRectangles([]);
    setSelectedId(null);
  };

  const loadFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setRectangles(data);
          setSelectedId(null);
        }
      } catch (err) {
        setError('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const exportToFile = () => {
    const dataStr = JSON.stringify(rectangles, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${new Date().toISOString()}.json`;
    link.click();
  };

  const getSelectedRect = () => {
    return rectangles.find(rect => rect.id === selectedId) || null;
  };

  const selectedRect = getSelectedRect();

  if (loading) {
    return <div className="loading">Loading annotations...</div>;
  }

  return (
    <div className="canvas-container">
      <div className="header">
        <h2>Welcome, {user?.username}!</h2>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="toolbar">
        <button 
          onClick={() => setIsDrawing(!isDrawing)}
          className={isDrawing ? 'active' : ''}
        >
          {isDrawing ? 'Drawing Mode ON' : 'Start Drawing'}
        </button>
        
        <button onClick={deleteSelected} disabled={!selectedId}>
          Delete Selected
        </button>
        
        <button onClick={clearAll} disabled={rectangles.length === 0}>
          Clear All
        </button>
        
        <button onClick={saveAnnotations} disabled={rectangles.length === 0}>
          Save to Database
        </button>
        
        <button onClick={exportToFile} disabled={rectangles.length === 0}>
          Export to File
        </button>
        
        <button onClick={() => fileInputRef.current.click()}>
          Import from File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={loadFromFile}
          accept=".json"
          style={{ display: 'none' }}
        />
        
        <label>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          Auto-save to Database
        </label>
      </div>

      {selectedRect && (
        <div className="info-panel">
          <h3>Selected Rectangle</h3>
          <p>Position: X={Math.round(selectedRect.x)}, Y={Math.round(selectedRect.y)}</p>
          <p>Size: {Math.round(selectedRect.width)} x {Math.round(selectedRect.height)}</p>
          <p>Color: <span style={{ 
            display: 'inline-block', 
            width: '20px', 
            height: '20px', 
            backgroundColor: selectedRect.color,
            verticalAlign: 'middle',
            marginLeft: '5px'
          }}></span></p>
        </div>
      )}

      <div className="canvas-wrapper">
        <Stage
          width={800}
          height={600}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ border: '1px solid #ccc' }}
        >
          <Layer>
            {rectangles.map((rect) => (
              <Rect
                key={rect.id}
                id={rect.id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={rect.color}
                opacity={0.6}
                draggable
                stroke={selectedId === rect.id ? 'blue' : 'black'}
                strokeWidth={selectedId === rect.id ? 3 : 1}
                onClick={() => setSelectedId(rect.id)}
                onTap={() => setSelectedId(rect.id)}
                onDragEnd={(e) => handleDragEnd(e, rect.id)}
                onTransformEnd={(e) => handleTransformEnd(e, rect.id)}
              />
            ))}
            
            {currentRect && (
              <Rect
                x={currentRect.width > 0 ? currentRect.x : currentRect.x + currentRect.width}
                y={currentRect.height > 0 ? currentRect.y : currentRect.y + currentRect.height}
                width={Math.abs(currentRect.width)}
                height={Math.abs(currentRect.height)}
                fill="rgba(0, 0, 255, 0.3)"
                stroke="blue"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}
            
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      <div className="stats">
        <p>Total Rectangles: {rectangles.length}</p>
        <p>Mode: {isDrawing ? 'Drawing' : 'Selecting/Editing'}</p>
      </div>
    </div>
  );
}

export default Canvas;