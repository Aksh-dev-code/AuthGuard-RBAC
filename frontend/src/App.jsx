import { useState } from 'react'
import {BrowserRouter as Router, Routes,Route, Link} from "react-router-dom";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Router>
      <Routes>
        <Route path='/Home' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/registernp' element={<Register/>}/>
      </Routes>
    </Router>

    </>
  )
}

export default App
