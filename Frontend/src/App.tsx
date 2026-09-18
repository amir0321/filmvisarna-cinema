import { Outlet } from 'react-router'
import Header from './components/header'

function App() {
  return (
    <>
      <div className="app">
        <Header />
        <div className="main">
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default App
