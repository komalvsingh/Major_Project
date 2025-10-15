import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from './components/AuthContext.jsx';
import Navbar from "./components/Navbar.jsx";
import WalletButton from "./components/WalletButton";
import ScholarshipChatbot from "./components/ScholarshipChatbot.jsx"; // Import chatbot

import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Status from "./pages/Status";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ScholarshipApplication from "./pages/Apply";
import RoleAssignPage from "./pages/rolemanage.jsx";
import SAGVerifyPage from "./pages/SAGpage.jsx";
import AdminApprovePage from "./pages/AdminApprovePage.jsx";
import CreateScholarshipScheme from "./pages/ScholarshipScheme.jsx";
import ScholarshipListing from "./pages/Scholarshiplisting.jsx";
import FinanceDisbursement from "./pages/FinanceBureau.jsx";
import DocumentVerificationUI from "./components/DocVerify.jsx";

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
        
        <Route path="/apply" element={<ScholarshipApplication />} />
         <Route path="/sag" element={<SAGVerifyPage/>} />
         <Route path="/role" element={<RoleAssignPage />} />
         <Route path="/admin" element={<AdminApprovePage/>} />
        <Route path="/finance" element={<FinanceDisbursement/>} />
         <Route path="/list" element={<ScholarshipListing/>} />
         <Route path="/scheme" element={<CreateScholarshipScheme/>} />
        <Route path="/status" element={currentUser ? <Status /> : <Navigate to="/login" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify" element={<DocumentVerificationUI/>} />
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" /> : <Register />} />
      </Routes>

      {/* Global Chatbot - Visible on all pages */}
      <ScholarshipChatbot />
    </div>
  );
}

export default App;