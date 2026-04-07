import { Layout } from "./components/layout/Layout";

function App() {
  return (
    <Layout
      sidebar={<div>Object List</div>}
      map={<div>Map will be here</div>}
    />
  );
}

export default App;