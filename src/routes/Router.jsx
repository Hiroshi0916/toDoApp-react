import React from 'react'
import { useSelector } from 'react-redux'
import {
  BrowserRouter,
  Route,
  useLocation,
  Navigate,
  Routes,
} from 'react-router-dom'
import { Home } from '../pages/Home'
import { NotFound } from '../pages/NotFound'
import { SignIn } from '../pages/SignIn'
import { NewTask } from '../pages/NewTask'
import { NewList } from '../pages/NewList'
import { EditTask } from '../pages/EditTask'
import { SignUp } from '../pages/SignUp'
import { EditList } from '../pages/EditList'

const PrivateRoute = ({ children }) => {
  const auth = useSelector((state) => state.auth.isSignIn)
  const location = useLocation()

  return auth ? children : <Navigate to="/signin" state={{ from: location }} />
}

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/task/new"
          element={
            <PrivateRoute>
              <NewTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/list/new"
          element={
            <PrivateRoute>
              <NewList />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId/tasks/:taskId"
          element={
            <PrivateRoute>
              <EditTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId/edit"
          element={
            <PrivateRoute>
              <EditList />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
