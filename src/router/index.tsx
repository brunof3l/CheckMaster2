import { Navigate, Route, Routes } from 'react-router-dom'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'
import Checklists from '@/pages/Checklists'
import ChecklistDetail from '@/pages/Checklists/Detail'
import ChecklistWizard from '@/pages/Checklists/Wizard'
import ChecklistNew from '@/pages/Checklists/New'
import Veiculos from '@/pages/Veiculos'
import Fornecedores from '@/pages/Fornecedores'
import Admin from '@/pages/Admin'
import UsersAdmin from '@/pages/Admin/UsersAdmin'
import Configuracoes from '@/pages/Configuracoes'
import ProtectedRoute from '@/router/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/checklists"
        element={
          <ProtectedRoute>
            <Checklists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/new"
        element={
          <ProtectedRoute>
            <ChecklistWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id"
        element={
          <ProtectedRoute>
            <ChecklistDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/edit"
        element={
          <ProtectedRoute>
            <ChecklistWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/veiculos"
        element={
          <ProtectedRoute>
            <Veiculos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fornecedores"
        element={
          <ProtectedRoute>
            <Fornecedores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <UsersAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/checklists" replace />} />
    </Routes>
  )
}
