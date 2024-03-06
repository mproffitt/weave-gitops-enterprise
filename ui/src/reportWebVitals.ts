import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function logDelta({name, id, delta}: {name: string, id: string, delta: number}) {
  console.log(`${name} matching ID ${id} changed by ${delta}`);
}

const reportWebVitals = () => {
  onFID(logDelta);
  onFCP(logDelta);
  onLCP(logDelta);
  onTTFB(logDelta);
  onCLS(logDelta);
};

export default reportWebVitals;
