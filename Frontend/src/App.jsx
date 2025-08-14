import WalletButton from "./components/WalletButton";

import Scholarships from "./pages/Scholarships";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Status from "./pages/Status";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
function App(){
  const router = createBrowserRouter([
    {
    path: "/",
    element: <Home />,
    },
    {
    path: "/scholarships",
    element: <Scholarships />,
    },
    {
    path: "/apply",
    element: <Apply />,
    },
    {
    path: "/status",
    element: <Status />,
    },
    {
    path: "/contact",
    element: <Contact />,
    },
    {
    path: "/login",
    element: <Login />,
    },
    {
    path: "/register",
    element: <Register />,
    },

  ]);
  return(
<div>
  <WalletButton></WalletButton>
</div>
    <div className="pt-16">
      <RouterProvider router={router} />
    </div>
  );
}
export default App;