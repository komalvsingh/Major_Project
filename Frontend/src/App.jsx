import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from './components/AuthContext.jsx';
import Navbar from "./components/Navbar.jsx";
import WalletButton from "./components/WalletButton";

import Scholarships from "./pages/Scholarships.jsx";
import Home from "./pages/Home.jsx";
import Apply from "./pages/Apply.jsx";
import Status from "./pages/Status.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Test from "./components/test.jsx";


function App(){
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }
  
  return(
    <div className="pt-16">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/test" element={<Test/>} />
        <Route path="/status" element={currentUser ? <Status /> : <Navigate to="/login" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" /> : <Register />} />
      </Routes>
    </div>
  );
}

export default App;