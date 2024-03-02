import { PropsWithChildren } from "react"
import { Toaster } from "react-hot-toast"

const ToastProvider = ({children}:PropsWithChildren) => {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      { children }
    </>
  )
}

export default ToastProvider