import { DndProvider } from "react-dnd";
import { Scene } from "./pages/scene";
import { HTML5Backend } from "react-dnd-html5-backend";

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Scene />
    </DndProvider>
  );
}

export default App;
