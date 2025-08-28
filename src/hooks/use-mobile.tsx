import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // This function will be called when the media query status changes
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set the initial value correctly after the component has mounted
    setIsMobile(mql.matches)

    // Add the event listener
    mql.addEventListener("change", onChange)

    // Clean up the event listener when the component unmounts
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}
