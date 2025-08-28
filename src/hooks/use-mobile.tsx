import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Check if window is defined to ensure this runs only on the client
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // This function will be called when the media query status changes
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set the initial value after the component has mounted
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
