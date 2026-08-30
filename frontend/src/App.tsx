import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ManageCourse from "./pages/ManageCourse";
import CourseViewer from "./pages/CourseViewer";  
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings"; 
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/manage-course/:courseId" element={<ManageCourse />} />
      {/* 🚀 This is the exact route React was complaining about missing! */}
      <Route path="/learn/:courseId" element={<CourseViewer />} /> 
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;