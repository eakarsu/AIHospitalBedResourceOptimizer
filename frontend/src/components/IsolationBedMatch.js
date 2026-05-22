import React, { useEffect, useState } from 'react';

export default function IsolationBedMatch() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/isolation-bed-match')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div>Loading isolation bed match...</div>;

  return (
    <div>
      <h1>Isolation Bed Match</h1>
      <p>Match patients to safe isolation rooms using precautions, bed constraints, and transfer blockers.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '20px 0' }}>
        {Object.entries(data.summary).map(([key, value]) => (
          <div key={key} style={{ background: 'white', padding: 18, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2>{value}</h2>
            <p>{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <section style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Recommended Matches</h2>
          {data.matches.map((match) => (
            <div key={match.patient} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
              <strong>{match.patient} - {match.recommendedBed}</strong>
              <p>{match.precaution} from {match.unit}. {match.reason}</p>
            </div>
          ))}
        </section>
        <section style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Constraints</h2>
          {data.constraints.map((item) => (
            <div key={item.constraint} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
              <strong>{item.constraint}</strong>
              <p>{item.affectedBeds} affected beds</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
