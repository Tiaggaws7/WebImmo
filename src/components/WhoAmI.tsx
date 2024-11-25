import React, { useState } from 'react';
import WhoAmI1 from './WhoAmI1';
import WhoAmI2 from './WhoAmI2';
import WhoAmI3 from './WhoAmI3';

const WhoAmI: React.FC = () => {
  const [selectedDesign, setSelectedDesign] = useState<number>(1);

  const renderSelectedDesign = () => {
    switch (selectedDesign) {
      case 1:
        return <WhoAmI1 />;
      case 2:
        return <WhoAmI2 />;
      case 3:
        return <WhoAmI3 />;
      default:
        return <WhoAmI1 />;
    }
  };

  return (
    <div>
      <div style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000 }}>
        <select
          value={selectedDesign}
          onChange={(e) => setSelectedDesign(Number(e.target.value))}
          style={{
            padding: '5px 10px',
            fontSize: '32px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            backgroundColor: 'black',
            color:'white',
            marginLeft:'80%',
            marginTop:'40%',
          }}
        >
          <option value={1}>Design 1</option>
          <option value={2}>Design 2</option>
          <option value={3}>Design 3</option>
        </select>
      </div>
      {renderSelectedDesign()}
    </div>
  );
};

export default WhoAmI;