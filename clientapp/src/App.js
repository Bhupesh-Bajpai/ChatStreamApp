import {Routes,Route} from 'react-router-dom'
import './App.css';
import Userscreen from './chatScreen/Userscreen';
import RoomPage from './chatScreen/RoomScreen';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Userscreen/>} />
        <Route path='/room/:roomId' element={<RoomPage/>} />
      </Routes>

    </div>
  );
}

export default App;
