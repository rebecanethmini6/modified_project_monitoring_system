import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { StudentRegister } from "./pages/StudentRegister";
import { LecturerRegister } from "./pages/LecturerRegister";
import { StudentDashboard } from "./pages/StudentDashboard";
import { LecturerDashboard } from "./pages/LecturerDashboard";
import { NewProject } from "./pages/NewProject";
import { ProjectView } from "./pages/ProjectView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register/student",
    Component: StudentRegister,
  },
  {
    path: "/register/lecturer",
    Component: LecturerRegister,
  },
  {
    path: "/student/dashboard",
    Component: StudentDashboard,
  },
  {
    path: "/lecturer/dashboard",
    Component: LecturerDashboard,
  },
  {
    path: "/student/project/new",
    Component: NewProject,
  },
  {
    path: "/student/project/:projectId",
    Component: ProjectView,
  },
]);
