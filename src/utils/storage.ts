import { VALID_ROUTES, DEFAULT_ROUTE } from '../config/constant'

const LAST_VISITED_PATH_KEY = 'ethan-dapp-last-visited-path'

const isValidRoute = (
  path: string | null,
): path is (typeof VALID_ROUTES)[number] => {
  return (
    path !== null &&
    VALID_ROUTES.includes(path as (typeof VALID_ROUTES)[number])
  )
}

export const getLastVisitedPath = (): string => {
  try {
    const lastPath = localStorage.getItem(LAST_VISITED_PATH_KEY)

    if (isValidRoute(lastPath)) {
      return lastPath
    }
  } catch (error) {
    console.error('Error reading last visited path:', error)
  }

  return DEFAULT_ROUTE
}

export const setLastVisitedPath = (path: string): void => {
  try {
    if (isValidRoute(path)) {
      localStorage.setItem(LAST_VISITED_PATH_KEY, path)
    }
  } catch (error) {
    console.error('Error saving last visited path:', error)
  }
}
