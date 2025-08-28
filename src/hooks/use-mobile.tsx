import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // This function will be called when the media query status changes
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Set the initial value correctly after the component has mounted
    // This is the key to preventing hydration errors.
    setIsMobile(mql.matches)

    // Add the event listener for future changes
    try {
        mql.addEventListener("change", onChange)
    } catch (e) {
        // Fallback for older browsers
        mql.addListener(onChange)
    }

    // Clean up the event listener when the component unmounts
    return () => {
        try {
            mql.removeEventListener("change", onChange)
        } catch (e) {
            // Fallback for older browsers
            mql.removeListener(onChange)
        }
    }
  }, [])

  return isMobile
}
