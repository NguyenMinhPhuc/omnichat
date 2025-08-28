import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches)
    }

    // Check on initial mount
    checkDevice()

    // Add listener for window resize
    window.addEventListener('resize', checkDevice)

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [])

  return isMobile
}
