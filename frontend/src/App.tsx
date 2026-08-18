import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ManageCourse from "./pages/ManageCourse"; // <-- Make sure to import this!

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* 🚀 This tells React to load the new page when the button is clicked */}
      <Route path="/manage-course/:courseId" element={<ManageCourse />} />
    </Routes>
  );
}

export default App;
