/**
 * "Back" that returns to wherever the user came from inside the app, or to a fallback page when
 * they arrived directly (a shared link, a new tab).
 */
export function useGoBack(fallback: string = '/') {
  const router = useRouter()
  return () => {
    if (import.meta.client && window.history.state?.back) router.back()
    else navigateTo(fallback)
  }
}
