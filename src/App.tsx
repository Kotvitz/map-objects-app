import { Layout } from "./components/layout/Layout";
import { MapView } from "./features/map/MapView";

function App() {
  return (
    <Layout
      sidebar={<div>Object List</div>}
      map={<MapView />}
    />
  );
}

export default App;