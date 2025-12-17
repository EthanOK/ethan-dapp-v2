import { Navigate } from 'react-router-dom'
import { getLastVisitedPath } from '../utils/storage'

export const HomeRedirect = () => {
  const lastPath = getLastVisitedPath()
  return <Navigate to={lastPath} replace />
}
